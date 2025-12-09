import Navbar from './Navbar'
import Hero from './Hero.jsx'
import About from './About.jsx'
import Contact from './Contact.jsx'
import Footer from './Footer.jsx'

function Home() {
    return (
        <div className="relative w-full bg-[#090909]">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full 
                        bg-[#DBF63C] opacity-[0.35] blur-[180px]"></div>

                <div className="absolute top-[-150px] right-[-150px] w-[650px] h-[650px] rounded-full 
                        bg-[#DBF63C] opacity-[0.30] blur-[180px]"></div>

                <div className="absolute bottom-[-250px] left-[10%] w-[900px] h-[900px] rounded-full
                        bg-[#3173AD] opacity-[0.25] blur-[250px]"></div>
            </div>

            <Navbar />
            <Hero />
            <About />
            <Contact />
            <Footer />
        </div>
    )
}

export default Home
