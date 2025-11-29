'use client';
import React from 'react';

const ClientLogos = () => {
  // Sample client logos - you can replace these with actual client logo URLs
  const clients = [
    {
      name: "Mia Transport",
      logo: "/clients-logos/mia-transport.jpeg", // Replace with actual logo path
      alt: "mia-transport-logo"
    },
    {
      name: "Shahzad Tour Travels",
      logo: "/clients-logos/shahzad-tour-travels.jpeg",
      alt: "Shahzad Tour Travels Logo"
    },
    {
      name: "Ark Rent Car",
      logo: "/clients-logos/ark-rent-car.jpeg",
      alt: "Ark Rent Car Logo"
    },
    {
      name: "Power Engineering",
      logo: "/clients-logos/power-engineering.jpeg",
      alt: "Power Engineering Logo"
    },
    {
      name: "Indegrity",
      logo: "/clients-logos/indegrity.jpeg",
      alt: "Indegrity Logo"
    },
    {
      name: "Eepcon",
      logo: "/clients-logos/eepcon.jpeg",
      alt: "Eepcon Logo"
    },
    {
      name: "Vision Village",
      logo: "/clients-logos/vision-village.jpeg",
      alt: "Vision Village Logo"
    }
  ];

  // Duplicate the array for seamless infinite scroll
  const duplicatedClients = [...clients, ...clients];

  return (
    <section className="py-16 bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Our Clients
          </h2>
        </div>
        
        <div className="relative overflow-hidden">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
          
          {/* Sliding container */}
          <div className="flex animate-slide">
            {duplicatedClients.map((client, index) => (
              <div
                key={`${client.name}-${index}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center"
              >
                <div className="bg-white rounded-full p-0 shadow-sm hover:shadow-md transition-shadow duration-300 opacity-90 hover:opacity-100 w-20 h-20 flex items-center justify-center">
                  <img
                    src={client.logo}
                    alt={client.alt}
                    className="w-14 h-14 rounded-lg object-contain filter transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-slide {
          animation: slide 30s linear infinite;
        }
        
        .animate-slide:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default ClientLogos;
