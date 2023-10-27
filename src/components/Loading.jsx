import React from 'react'

export default function Loading() {
  return (
    <>
      {/* parent div to change size */}
      <div className='flex flex-col items-center justify-center w-full h-full'>
        <h2>Loading</h2>
        <span className="loading loading-ring loading-md"></span>
      </div>

    </>
  )
}
