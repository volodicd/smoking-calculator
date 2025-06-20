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
    /^http:\/\/localhost:\d+$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})

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
    // DEBUG: Log what we received
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
            isJoined: true
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

// Submit score endpoint
app.post('/api/submit-score', async (request, reply) => {
  try {
    const body = request.body as { participantId: string, score: number }

    if (!body?.participantId || body?.score === undefined) {
      reply.status(400)
      return { error: 'Participant ID and score are required' }
    }

    if (body.score < 0 || body.score > 100) {
      reply.status(400)
      return { error: 'Score must be between 0 and 100' }
    }

    // Update participant score
    const participant = await prisma.participant.update({
      where: { id: body.participantId },
      data: {
        score: body.score,
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

    // Check if all participants have submitted
    if (submittedParticipants.length === session.participantCount) {
      // Calculate average score
      const totalScore = submittedParticipants.reduce((sum, p) => sum + (p.score || 0), 0)
      const averageScore = totalScore / submittedParticipants.length
      const canSmoke = averageScore >= session.threshold

      // Create group result
      await prisma.groupResult.create({
        data: {
          sessionId: session.id,
          averageScore,
          canSmoke
        }
      })

      // Update session status
      await prisma.session.update({
        where: { id: session.id },
        data: { status: 'COMPLETED' }
      })
    }

    return { success: true }
  } catch (error) {
    app.log.error('Error submitting score:', error)
    reply.status(500)
    return { error: 'Internal server error' }
  }
})

app.get('/health', () => ({ status: 'ok' }))

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