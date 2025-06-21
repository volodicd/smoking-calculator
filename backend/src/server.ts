import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'

const app = Fastify({ logger: true })
const prisma = new PrismaClient()

// Register CORS
app.register(cors, {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost',
    /^http:\/\/localhost:\d+$/,
    'https://calculator.volodic.com',
    'http://calculator.volodic.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})

// Group score calculation helper
async function calculateGroupScore(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { participants: true }
  })

  if (!session) return

  const submittedParticipants = session.participants.filter(p => p.hasSubmitted)

  // Calculate averages
  const avgRarity = submittedParticipants.reduce((sum, p) => sum + (p.rarity || 0), 0) / submittedParticipants.length
  const avgSocial = submittedParticipants.reduce((sum, p) => sum + (p.social || 0), 0) / submittedParticipants.length
  const avgDistance = submittedParticipants.reduce((sum, p) => sum + (p.distance || 0), 0) / submittedParticipants.length
  const avgContext = submittedParticipants.reduce((sum, p) => sum + (p.context || 0), 0) / submittedParticipants.length

  // Calculate penalties
  let penalties = 0
  if (session.recentPenalty) penalties += 15
  if (session.sickPenalty) penalties += 10
  if (session.importantPenalty) penalties += 5

  // Apply formula
  const groupScore = Math.round(Math.max(0,
    ((avgRarity - 1) * 3) +
    ((avgSocial - 1) * 3) +
    ((avgDistance - 1) * 2) +
    ((avgContext - 1) * 3) -
    penalties
  ))

  const canSmoke = groupScore >= session.threshold

  // Update or create group result
  await prisma.groupResult.upsert({
    where: { sessionId },
    update: {
      averageScore: groupScore,
      canSmoke
    },
    create: {
      sessionId,
      averageScore: groupScore,
      canSmoke
    }
  })

  // Update session status
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' }
  })
}

// Types
interface CreateSessionBody {
  name: string
  participantCount?: number
  adminSecret: string
}

// Helper function to generate random codes
function generateCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Create session endpoint
app.post('/api/sessions', async (request, reply) => {
  try {
    app.log.info('Received request body:', JSON.stringify(request.body))
    app.log.info('Content-Type:', request.headers['content-type'])

    const body = request.body as CreateSessionBody

    if (!body?.name) {
      app.log.error('Missing name field in body:', JSON.stringify(body))
      reply.status(400)
      return { error: 'Session name is required' }
    }

    if (!body?.adminSecret || body.adminSecret.length < 6) {
      reply.status(400)
      return { error: 'Admin secret must be at least 6 characters' }
    }

    const participantCount = body.participantCount || 10

    // Generate unique join code
    let joinCode: string
    let isUnique = false
    do {
      joinCode = generateCode(6)
      const existing = await prisma.session.findUnique({
        where: { joinCode }
      })
      isUnique = !existing
    } while (!isUnique)

    // Create session with participants
    const session = await prisma.session.create({
      data: {
        name: body.name,
        joinCode,
        adminSecret: body.adminSecret,
        participantCount,
        participants: {
          create: Array.from({ length: participantCount }, () => ({
            hashCode: generateCode(8)
          }))
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            hashCode: true,
            hasSubmitted: true,
            isJoined: true
          }
        }
      }
    })

    app.log.info('Session created successfully:', session.id)
    return session
  } catch (error) {
    app.log.error('Error creating session:', error)
    reply.status(500)
    return { error: 'Internal server error' }
  }
})

// Get session by admin secret
app.post('/api/admin/session', async (request, reply) => {
  try {
    const body = request.body as { adminSecret: string }

    if (!body?.adminSecret) {
      reply.status(400)
      return { error: 'Admin secret is required' }
    }

    const session = await prisma.session.findFirst({
      where: { adminSecret: body.adminSecret },
      include: {
        participants: {
          select: {
            id: true,
            hashCode: true,
            hasSubmitted: true,
            isJoined: true,
            score: true,
            rarity: true,
            social: true,
            distance: true,
            context: true
          }
        },
        groupResult: true,
        _count: {
          select: { participants: true }
        }
      }
    })

    if (!session) {
      reply.status(404)
      return { error: 'Session not found' }
    }

    return {
      ...session,
      participantCount: session._count.participants
    }
  } catch (error) {
    app.log.error('Error fetching session:', error)
    reply.status(500)
    return { error: 'Internal server error' }
  }
})

// Join session endpoint
app.post('/api/join', async (request, reply) => {
  try {
    const body = request.body as { joinCode: string }

    if (!body?.joinCode) {
      reply.status(400)
      return { error: 'Join code is required' }
    }

    // Find session by join code
    const session = await prisma.session.findFirst({
      where: {
        joinCode: body.joinCode.toUpperCase(),
        status: 'ACTIVE'
      },
      include: {
        participants: true,
        _count: {
          select: { participants: true }
        }
      }
    })

    if (!session) {
      reply.status(404)
      return { error: 'Session not found or not active' }
    }

    // Check if session is full
    const joinedCount = session.participants.filter(p => p.isJoined).length
    if (joinedCount >= session.participantCount) {
      reply.status(400)
      return { error: 'Session is full' }
    }

    // Find available participant slot
    const availableParticipant = session.participants.find(p => !p.isJoined)

    if (!availableParticipant) {
      reply.status(400)
      return { error: 'No available slots' }
    }

    // Mark participant as joined
    const updatedParticipant = await prisma.participant.update({
      where: { id: availableParticipant.id },
      data: { isJoined: true }
    })

    return {
      sessionId: session.id,
      sessionName: session.name,
      participantId: updatedParticipant.id,
      hashCode: updatedParticipant.hashCode
    }
  } catch (error) {
    app.log.error('Error joining session:', error)
    reply.status(500)
    return { error: 'Internal server error' }
  }
})



// Set penalties endpoint
app.post('/api/admin/set-penalties', async (request, reply) => {
  try {
    const body = request.body as {
      adminSecret: string
      penalties: { recent: boolean, sick: boolean, important: boolean }
    }

    if (!body?.adminSecret) {
      reply.status(400)
      return { error: 'Admin secret is required' }
    }

    // First find the session by adminSecret
    const existingSession = await prisma.session.findFirst({
      where: { adminSecret: body.adminSecret },
      include: { participants: true }
    })

    if (!existingSession) {
      reply.status(404)
      return { error: 'Session not found' }
    }

    // Update session penalties using unique id
    const session = await prisma.session.update({
      where: { id: existingSession.id },
      data: {
        recentPenalty: body.penalties.recent,
        sickPenalty: body.penalties.sick,
        importantPenalty: body.penalties.important
      },
      include: {
        participants: true,
        groupResult: true
      }
    })

    // Recalculate group score if all participants submitted
    const submittedParticipants = session.participants.filter(p => p.hasSubmitted)
    if (submittedParticipants.length === session.participantCount) {
      await calculateGroupScore(session.id)
    }

    return { success: true, session }
  } catch (error) {
    app.log.error('Error setting penalties:', error)
    reply.status(500)
    return { error: 'Internal server error' }
  }
})

// Submit score endpoint
app.post('/api/submit', async (request, reply) => {
  try {
    const body = request.body as {
      participantId: string
      rarity: number
      social: number
      distance: number
      context: number
    }

    if (!body?.participantId || !body?.rarity || !body?.social || !body?.distance || !body?.context) {
      reply.status(400)
      return { error: 'Participant ID and all criteria are required' }
    }

    // Validate criteria ranges
    const criteria = [body.rarity, body.social, body.distance, body.context]
    if (criteria.some(val => val < 1 || val > 10)) {
      reply.status(400)
      return { error: 'All criteria must be between 1 and 10' }
    }

    // Calculate individual score (no penalties)
    const individualScore = Math.round(
      ((body.rarity - 1) * 3) +
      ((body.social - 1) * 3) +
      ((body.distance - 1) * 2) +
      ((body.context - 1) * 3)
    )

    // Update participant
    const participant = await prisma.participant.update({
      where: { id: body.participantId },
      data: {
        rarity: body.rarity,
        social: body.social,
        distance: body.distance,
        context: body.context,
        score: individualScore,
        hasSubmitted: true
      },
      include: {
        session: {
          include: {
            participants: true
          }
        }
      }
    })

    const session = participant.session
    const submittedParticipants = session.participants.filter(p => p.hasSubmitted)

    // Check if all participants submitted
    if (submittedParticipants.length === session.participantCount) {
      await calculateGroupScore(session.id)
    }

    return {
      success: true,
      personalScore: individualScore
    }
  } catch (error) {
    app.log.error('Error submitting score:', error)
    reply.status(500)
    return { error: 'Internal server error' }
  }
})
app.post('/api/participant/status', async (request, reply) => {
  try {
    const body = request.body as { participantId: string }

    if (!body?.participantId) {
      reply.status(400)
      return { error: 'Participant ID is required' }
    }

    // Find participant and their session
    const participant = await prisma.participant.findUnique({
      where: { id: body.participantId },
      include: {
        session: {
          include: {
            participants: {
              select: {
                id: true,
                hasSubmitted: true,
                isJoined: true
              }
            },
            groupResult: true
          }
        }
      }
    })

    if (!participant || !participant.session) {
      reply.status(404)
      return { error: 'Participant or session not found' }
    }

    const session = participant.session

    // Calculate current status
    const joinedCount = session.participants.filter(p => p.isJoined).length
    const submittedCount = session.participants.filter(p => p.hasSubmitted).length
    const totalCount = session.participantCount

    // Check if session is completed
    if (session.status === 'COMPLETED' && session.groupResult) {
      return {
        id: session.id,
        status: 'COMPLETED',
        joinedCount,
        submittedCount,
        totalCount,
        groupResult: {
          averageScore: session.groupResult.averageScore,
          canSmoke: session.groupResult.canSmoke,
          appliedPenalties: (session.recentPenalty ? 15 : 0) +
                          (session.sickPenalty ? 10 : 0) +
                          (session.importantPenalty ? 5 : 0)
        }
      }
    }

    // Session still active
    return {
      id: session.id,
      status: 'ACTIVE',
      joinedCount,
      submittedCount,
      totalCount
    }

  } catch (error) {
    app.log.error('Error fetching participant status:', error)
    reply.status(500)
    return { error: 'Internal server error' }
  }
})

app.get('/api/health', () => ({ status: 'ok' }))

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    app.log.info('Server running on 0.0.0.0:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()