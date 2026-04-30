import jwt from 'jsonwebtoken'
import 'dotenv/config'

const secret = process.env.JWT_SECRET || 'fallback_secret'
const token = jwt.sign({ user: 'test_user' }, secret)

console.info(token)
