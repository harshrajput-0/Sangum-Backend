// About.tsx
import { Link } from 'react-router-dom'

function About() {
  return (
    <section className='min-h-screen bg-[#0A0D0F] text-[#FFFDFC]'>
      <h1>About</h1>
      <p>
        This app was built with <code>React</code>, <code>TypeScript</code>,
        and <code>Vite</code>. It's a starting point for building fast,
        modern web apps with hot module replacement and a great developer
        experience.
      </p>
      <p>
        Feel free to explore the code, tweak the components, and make it
        your own.
      </p>
      <Link to="/">← Back to Home</Link>
    </section>
  )
}

export default About