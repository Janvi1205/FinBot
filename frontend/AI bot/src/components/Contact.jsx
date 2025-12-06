import { useState } from 'react'
import emailjs from 'emailjs-com'
const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        emailjs.send(
            "service_6y0ekys",      
            "template_gy1fdcc",     
            {
                from_name: formData.name,
                from_email: formData.email,
                message: formData.message,
            },
            "eOtOfTd57KdRV6HNn"        
        )
        .then(() => {
            alert("Message sent successfully!We wil contact you soon");
            setFormData({ name: "", email: "", message: "" });
        })
        .catch((error) => {
            console.error(error);
            alert("Failed to send message");
        });
    };

    return (
        <section id="contact" className="relative w-full flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 overflow-hidden py-12 sm:py-16 lg:py-20">
            <div className="relative z-10 w-full max-w-7xl mx-auto">
                
              
                <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
                        Contact Us
                    </h2>
                   
                </div>

         
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8 md:gap-2 sm:gap-12 w-full lg:ml-10! lg:mt-20!  ">
                    
                   
                    <div className="flex-1 space-y-6 sm:space-y-8 w-full md:ml-3! ">
                        <div className="rounded-2xl p-4 sm:p-6 lg:p-8">
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center sm:text-left sm:ml-0 lg:ml-[150px] mt-4 sm:mt-6 lg:mt-8">Get in Touch</h3>
                            
                            <div className= "flex flex-col gap-4 p-5!">
                                <div className="flex items-start gap-3 sm:gap-4 sm:ml-0 lg:ml-[150px]">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-ai-blue/20 flex items-center justify-center ">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-ai-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">Email</h4>
                                        <p className="text-gray-300 text-sm sm:text-base">projectfinbot@gmail.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 sm:gap-4 sm:ml-0 lg:ml-[150px]">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-ai-blue/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-ai-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">Phone</h4>
                                        <p className="text-gray-300 text-sm sm:text-base">+91 9123800696</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 sm:gap-4 sm:ml-0 lg:ml-[150px]">
                                    <div className="w-12 h-12 rounded-lg bg-ai-blue/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-ai-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">Address</h4>
                                        <p className="text-gray-300 text-sm sm:text-base">IIT Patna-801106</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                   
                    <div className="flex-1 w-full flex items-center justify-center">
                        <div className=" flex flex-col p-5! sm:p-5 lg:p-5  backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-lg shadow-black/20  w-full max-w-md mx-auto  mt-4 sm:mt-6 lg:mt-8 md:mr-20! ">
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Send us a Message</h3>
                            
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label htmlFor="name" className="block text-white font-medium mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-1! bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ai-yellow focus:border-transparent transition-all text-sm sm:text-base"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-white font-medium mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-1! bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ai-yellow focus:border-transparent transition-all text-sm sm:text-base"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-white font-medium mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        style={{padding:"7px"}}
                                        rows="5"
                                        className="w-full p-1! bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ai-yellow focus:border-transparent transition-all resize-none"
                                        placeholder="Your message here..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full p-1! bg-ai-yellow text-dark-black font-bold rounded-lg hover:bg-ai-yellow/90 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-ai-yellow/20 text-sm sm:text-base mt-2 sm:mt-4"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Contact

