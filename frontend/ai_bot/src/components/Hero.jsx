import { useState } from 'react'
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [imageError, setImageError] = useState(false)
  const navigate = useNavigate();
  
  
  const robotImageSrc = new URL('../assets/robot1.png', import.meta.url).href
  const arrow = new URL('../assets/arrow.png', import.meta.url).href

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 overflow-hidden pt-20 sm:pt-24 lg:-mt-19!">
      
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 mt-24! ">
        
        <div className="flex-1 flex justify-center lg:justify-start animate-float mt-[180px] sm:mt-28 lg:mt-[90px] xl:mt-20 ml-0 sm:ml-4 lg:ml-10 order-2 lg:order-1">
          <div className="relative w-full max-w-[250px] sm:max-w-[280px] md:max-w-md lg:max-w-lg xl:max-w-xl  ">
            {robotImageSrc && !imageError && (
              <img
                src={robotImageSrc}
                alt="AI Robot"
                className="w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[500px] lg:max-h-[600px] xl:max-h-[720px] drop-shadow-2xl object-contain"
                onError={() => setImageError(true)}
              />
            )}
            {imageError && (
              <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl h-[500px] bg-dark-grey rounded-2xl flex flex-col items-center justify-center text-white text-2xl font-bold border border-white/10">
                Robot Image
                <span className="text-sm text-white/60 mt-2 font-normal"></span>
              </div>
            )}
          </div>
        </div>

       
        <div className="gap-3.5 flex-1  flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-2 w-full">
          
          <h1 className=" text-4xl sm:text-7xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white  animate-fade-in">
            <span className="block">FinBot</span>
          </h1>

          <h2 className="text-base sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-bold text-white animate-fade-in-delay ml-0 sm:ml-4 lg:ml-10 xl:ml-20 px-4 sm:px-0 ">
            Your Guide to Smarter Money Decisions
          </h2>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 max-w-xl leading-relaxed animate-fade-in-delay px-4 sm:px-0 mt-4">
            Discover the best home loans, govt benefits, investment options, and more — powered by AI.
          </p>

         
          <div className="animate-fade-in-delay mt-8 sm:mt-12 lg:mt-16">
            <button 
               style={{padding:"10px", marginTop:"10px"}}
              onClick={() => navigate("/auth")}
              className="relative px-6 sm:px-8 lg:px-12 py-10 
              bg-ai-yellow rounded-lg
              shadow-lg shadow-ai-yellow/30
              hover:shadow-m hover:shadow-ai-yellow/50
              transition-all duration-300
              hover:scale-101
              active:scale-95
              flex items-center justify-center gap-2 sm:gap-3"
            >
              <span style={{color:"black", fontWeight:"bold"}} className="text-sm sm:text-base">Start Your Chat</span>
              <span><img className='h-3 sm:h-4' src={arrow} alt="" /></span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero