import React, { useState } from 'react'
import { auth, db } from '../firebase-config'
import { collection, where, getDocs, query, setDoc, doc } from '@firebase/firestore'
import { createUserWithEmailAndPassword } from '@firebase/auth'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'

export default function Register() {

  const [error, setError] = useState()
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault()
    const username = e.target.username.value
    const email = e.target.email.value
    const password = e.target.password.value
    const confirmPassword = e.target.confirmPassword.value
    let userid
    const validateEmail = (email) => {
      return email
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };


    const querySnapshot = await getDocs(query(collection(db, 'user'),
      where('username', '==', username)))


    if (!querySnapshot.empty) {
      setError('username have use')
    } else if (password.length < 8) {
      setError('password must have at least 8 characters ')
    } else if (password != confirmPassword) {
      setError('comfirmPassword incorrect')
    } else if (!validateEmail) {
      setError('email incorrect')
    } else if (username == '' || email == '' || password == '' || confirmPassword == '') {
      setError('please enter all fil')
    }
    else {
      createUserWithEmailAndPassword(auth, email, password)
        .then( (res) => {
          userid = res.user.uid
          setDoc(doc(db, "user", userid), {
            username: username
          })
          navigate('/')
        }).catch( (error) => {
          setError('email have use')
        });
    }
  }

  return (
    <section>
      {/* form */}
      <div className='flex flex-col justify-center items-center '>
        <div className='text-center mt-5'>
          <h5 className='font-KAUFMANN'>Sign up</h5>
          <p className='text-gray-300'>Get started with Us</p>
        </div>

        {/* form */}
        <form className="flex flex-col justify-center items-center w-[80vw]" onSubmit={handleSubmit}>

          <div className="mt-4 flex flex-col w-[80%]">
            <p className="text-xs">Username</p>
            <div className='w-full'>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              className="w-full my-2 p-2 border-b outline-none" />
            </div>
          </div>

          <div className="mt-4 flex flex-col w-[80%]">
            <p className="text-xs">Email</p>
            <div>
            <input
              id="email"
              type="text"
              placeholder="Enter your email"
              className="w-full my-2 p-2 border-b outline-none" />
            </div>
          </div>

          <div className="mt-4 flex flex-col w-[80%]">
            <p className="text-xs">Password</p>
            <div>
            <input
              id="password"
              type="password"
              placeholder="*****"
              className="w-full my-2 p-2 border-b outline-none" />
            </div>
          </div>

          <div className="mt-4 flex flex-col w-[80%]">
            <p className="text-xs">Confirm-Password</p>
            <div>
            <input
              id="confirmPassword"
              type="password"
              placeholder="*****"
              className="w-full my-2 p-2 border-b outline-none" />
            </div>
          </div>

          <p className=" w-[80%] mt-4 text-xs text-start text-red-300">{error && "* " + error}</p>
          <div className="mt-4 flex flex-col w-[80%]">
            <button type='submit'
              className="border border-black hover:bg-gray-700 hover:text-white my-2 p-2 transition-all duration-200 ease-in rounded-2xl"
            >Sign Up</button>
          </div>
        </form>

        {/* not have account */}
        <div className="flex my-5">
          <p className="text-xs">Already have account?</p>
          <Link to="/login" className="ml-2 text-xs text-center text-blue-300">Sign in</Link>
        </div>
      </div>

      {/* img */}
      <div>
      </div>

    </section>
  )
}
