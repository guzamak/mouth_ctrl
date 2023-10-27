import React from 'react'
import { Link } from 'react-router-dom'

export default function Error() {
  return (
      <div className='flex flex-col justify-center items-center mt-4 '>
        <h3>404 NotFound</h3>
        <Link to="/" className='mt-2'>return to Home</Link>
      </div>
  )
}
