import { useState } from 'react'
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [activeLink, setActiveLink] = useState('Home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Home", type: "scroll", id: "home" },
    { name: "About", type: "scroll", id: "about" },
    { name: "Contact", type: "scroll", id: "contact" },
    { name: "Chat", type: "route", path: "/auth" }
  ];

  return (
    <nav className="fixed top-5 left-5 lg:left-50 lg:right-50 sm:right-20 sm:left-20 md:right-30 md:left-30 right-5 z-50 py-2 sm:py-4 md:py-6 px-2 sm:px-4 ">
      <div className="max-w-7xl mx-auto">
        <div  className="flex h-[50px] sm:h-[60px] justify-between   items-center w-full sm:w-auto sm:mx-auto sm:max-w-[900px]  backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-lg shadow-black/20 py-2 sm:py-4 px-4 sm:px-6 lg:px-8">

          <div style={{marginLeft:"50px"}} className="text-white   text-xl sm:text-2xl font-bold ">
            FinBot
          </div>

          
          <div style={{marginRight:"30px"}} className="hidden sm:flex items-center text-lg sm:text-xl lg:text-2xl gap-4 sm:gap-6 lg:gap-8  " >
            {navItems.map((item) => (
              item.type === "route" ? (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setActiveLink(item.name)}
                  className={`
                    nav-link text-ai-white text-[18px] font-medium tracking-wide
                    cursor-pointer
                    ${activeLink === item.name ? 'text-ai-yellow' : ''}
                    transition-colors duration-300
                  `}
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={`#${item.id}`}
                  onClick={() => setActiveLink(item.name)}
                  className={`
                    nav-link text-ai-white text-[18px] font-medium tracking-wide
                    cursor-pointer
                    ${activeLink === item.name ? 'text-ai-yellow' : ''}
                    transition-colors duration-300
                  `}
                >
                  {item.name}
                </a>
              )
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button style={{marginRight:"40px"}}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-lg shadow-black/20 "style={{padding:"30px"}}>
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                item.type === "route" ? (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => {
                      setActiveLink(item.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-white text-lg font-medium ${
                      activeLink === item.name ? 'text-ai-yellow' : ''
                    }`}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={`#${item.id}`}
                    onClick={() => {
                      setActiveLink(item.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-white text-lg font-medium ${
                      activeLink === item.name ? 'text-ai-yellow' : ''
                    }`}
                  >
                    {item.name}
                  </a>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
