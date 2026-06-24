import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Car, Coffee, Wifi, Star } from 'lucide-react';

const iconMap: Record<string, any> = {
  Car: Car,
  Coffee: Coffee,
  Wifi: Wifi,
  Star: Star
};

export default function ServicesSection() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'services')));
        const servicesData: any[] = [];
        querySnapshot.forEach((doc) => {
          servicesData.push({ id: doc.id, ...doc.data() });
        });
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  if (services.length === 0) return null;

  return (
    <section className="py-16 bg-transparent transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Premium Services</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Experience world-class amenities designed for your comfort.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Star;
            return (
              <div key={service.id} className="p-6 bg-white/85 dark:bg-amber-950/40 backdrop-blur-sm rounded-2xl text-center hover:shadow-lg transition-shadow border border-amber-100/50 dark:border-amber-900/50">
                <div className="w-14 h-14 mx-auto bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{service.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
