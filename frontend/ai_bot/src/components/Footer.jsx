const Footer = () => {
    const currentYear = new Date().getFullYear()
     const doodle = new URL('../assets/doodle.png', import.meta.url).href

    return (
        <footer className="relative min-h-[300px] sm:min-h-[400px] lg:h-80 w-full bg-black border-t border-white/10 mt-8 sm:mt-12  overflow-hidden lg:mt-10!">

            <div className="relative z-10 px-4 sm:px-8 lg:px-16! pt-8 sm:pt-12 lg:pt-10! mt-6!">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight text-center sm:text-left sm:ml-0 lg:ml-8 xl:ml-16">
                   Let's Simplify Your
                </div>
                <div className=" text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mt-2 sm:mt-4 text-center sm:text-left sm:ml-0 lg:ml-16! xl:ml-32">
                Finance Questions with AI!
                </div>
            </div>
            
            <div className="block absolute ml-[30%]! lg:ml-230! lg:-mt-40!   ">
                <img className="h-32  sm:h-40 lg:h-48 xl:h-56 opacity-50" src={doodle} alt="" />
            </div>

            <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 text-center py-4 sm:py-6 px-4">
                <p className="text-gray-400 text-xs sm:text-sm">
                    © Copyright {currentYear}, FinBot. All rights reserved. All wrong reserved.
                </p>
            </div>

        </footer>
    )
}

export default Footer

