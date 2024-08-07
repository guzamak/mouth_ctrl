import React ,{useContext, useEffect, useState} from 'react'
import { Authcontext } from '../App'
import { Outlet, useNavigate } from 'react-router'
import { signOut } from '@firebase/auth'
import { auth, db } from "../firebase-config"
import { Link } from 'react-router-dom'

export default function Header({username}) {

  const { user } = useContext(Authcontext)
  const navigate = useNavigate()

  const logout = async () => {
    await signOut(auth)
    navigate("/");
  }

  return (
    <>
    <div className='flex flex-col items-center mx-[5vw] font-semibold'>
    <div className="flex items-center justify-start w-full  bg-base-100 h-[4rem]">
        <div className="flex-1">
          <Link to="/" className="normal-case font-KAUFMANN underline">Mouth ctrl</Link>
        </div>

        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><Link to="/drawing">Draw</Link></li>
            <li>
              <details className=' mr-3'>
                <summary>
                  User
                </summary>
                {user ?
                  <ul className="bg-base-100 w-fit">
                    <li><Link to={`user/${username}`}>User</Link></li>
                    <li onClick={logout}><a>SignOut</a></li>
                  </ul> :
                  <ul className="p-2 bg-base-100 ">
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/register">Register</Link></li>
                  </ul>}
              </details>
            </li>
          </ul>
        </div>

      </div>
      <div className='w-[100%] h-[1px] bg-secondary-200'></div>
    </div>

    <Outlet />
    </>
  )
}
