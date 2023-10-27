import React, { useState } from 'react'
import { auth, db } from '../firebase-config'
import { signInWithEmailAndPassword } from '@firebase/auth'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'

export default function Login() {


  const [error, setError] = useState()
  const navigate = useNavigate();


  const handleSubmit = (e) => {
    e.preventDefault()

    const email = e.target.email.value
    const password = e.target.password.value
    const validateEmail = (email) => {
      return email
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };

    if (email == '' || password == '') {
      setError('please enter all fil')
    } else if (!validateEmail(email)) {
      setError('email incorrect')
    } else {

      signInWithEmailAndPassword(auth, email, password).then((res) => {
        navigate('/')
      })
        .catch((error) => {
          setError('email or password incorrect')
        })

    }
  }


  return (
    <section>
      {/* form */}
      <div className='flex flex-col justify-center items-center '>
        <div className='text-center mt-5'>
          <h5 className='font-KAUFMANN'>Sign In</h5>
          <p className='text-gray-300'>Go to Account</p>
        </div>

        {/* form */}
        <form className="flex flex-col justify-center items-center w-[80vw]" onSubmit={handleSubmit}>


          <div className="mt-4 flex flex-col w-[80%]">
            <p className="text-xs">Email</p>
            <div>
              <input
                id="email"
                type="text"
                placeholder="Enter your email"
                className="w-full my-2 p-2  border-b outline-none" />
            </div>
          </div>

          <div className="mt-4 flex flex-col w-[80%]">
            <p className="text-xs">Password</p>
            <div>
              <input
                id="password"
                type="password"
                placeholder="*****"
                className="w-full my-2 p-2  border-b outline-none" />
            </div>
          </div>


          <p className=" w-[80%] mt-4 text-xs text-start text-red-300">{error && "* " + error}</p>
          <div className="mt-4 flex flex-col w-[80%]">
            <button type='submit'
              className="border border-black hover:bg-gray-700 hover:text-white my-2 p-2 transition-all duration-200 ease-in rounded-2xl"
            >Sign In</button>
          </div>
        </form>

        {/* not have account */}
        <div className="flex my-5">
          <p className="text-xs">Don't have account?</p>
          <Link to="/register" className="ml-2 text-xs text-center text-blue-300">Sign Up</Link>
        </div>
      </div>

      {/* img */}
      <div>
      </div>

  </section>

  )
}
