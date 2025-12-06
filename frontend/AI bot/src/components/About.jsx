import { useState } from 'react'


const About = () => {
    const [imageError, setImageError] = useState(false)

   
    const robotBookImageSrc = new URL('../assets/robot2.png', import.meta.url).href
     const dot = new URL('../assets/record-button.png', import.meta.url).href
    

    return (
        <section id="about" className="relative w-full flex items-center justify-between px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden py-12 sm:py-16 lg:py-20">
            <div  className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12">

                
                <div className="flex-1  flex flex-col  text-left  w-full lg:w-auto lg:ml-20! lg:-mt-20!">
                    
                    <h2 className="text-4xl lg:text-6xl sm:text-5xl md:text-6xl font-black text-white leading-tight ">
                        About
                    </h2>
                    <h2 className="ml-[30px]! text-4xl sm:text-5xl md:text-6xl font-black text-white  mt-8    ">FinBot</h2>



                    <div className="  max-w-xl mt-2! sm:mt-6 lg:mt-8 ml-0 sm:ml-4 lg:ml-16 flex flex-col gap-5 !p-6  ">

                        <div className="flex items-start gap-2 sm:gap-4 lg:gap-3">
                            <div   className="mt-1 sm:mt-1.5 "><img className='h-5 w-25   sm:h-4 sm:w-16' src={dot} alt="" /></div>
                            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                                At FinBot, we simplify financial decision-making for every Indian.
                                Our platform uses advanced AI combined with real-time Google search data to deliver accurate, trustworthy answers about government schemes, home loans, education loans, savings options, and more.
                            </p>
                        </div>

                       
                        <div className="flex items-start gap-2 sm:gap-4 lg:gap-3 ">
                            <div  className="mt-1 sm:mt-1.5 "><img className='h-5 w-12 sm:h-4 sm:w-8' src={dot} alt="" /></div>
                            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            Using cutting-edge Generative AI, our chatbot fetches real-time information from trusted sources and presents it in simple, clear language.
                            </p>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-4 lg:gap-3">
                            <div  className="mt-1 sm:mt-1.5 "><img className='h-5 w-12 sm:h-4 sm:w-7' src={dot} alt="" /></div>
                            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            Our mission is to ensure that every citizen can find the right scheme or loan without searching hundreds of websites.                            </p>
                        </div>
                    </div>



                </div>

                <div className="flex-1 flex  justify-center lg:justify-end animate-float w-full lg:w-auto  lg:mt-0">
                    <div className="relative w-full max-w-[280px] sm:max-w-md md:max-w-lg lg:max-w-xl mr-15!">
                        {robotBookImageSrc && !imageError && (
                            <img
                                src={robotBookImageSrc}
                                alt="AI Robot"
                                className="w-full h-auto sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[720px] drop-shadow-2xl object-contain"
                                onError={() => setImageError(true)}
                            />
                        )}
                        {imageError && (
                            <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-dark-grey rounded-2xl flex flex-col items-center justify-center text-white text-xl sm:text-2xl font-bold border border-white/10">
                                Robot Image
                                <span className="text-sm text-white/60 mt-2 font-normal"></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About

