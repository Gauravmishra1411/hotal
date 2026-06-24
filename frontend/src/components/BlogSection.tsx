import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRight } from 'lucide-react';

export default function BlogSection() {
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'blogs')));
        const blogsData: any[] = [];
        querySnapshot.forEach((doc) => {
          blogsData.push({ id: doc.id, ...doc.data() });
        });
        setBlogs(blogsData);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      }
    };
    fetchBlogs();
  }, []);

  if (blogs.length === 0) return null;

  return (
    <section className="py-16 bg-transparent transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Travel & Inspiration</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Discover stories, tips, and guides from our experts.</p>
          </div>
          <a href="#" className="hidden md:flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white/85 dark:bg-amber-950/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-amber-100/50 dark:border-amber-900/50 flex flex-col">
              <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                {blog.imageUrl ? (
                   <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">{blog.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{blog.content}</p>
                <button className="text-amber-600 dark:text-amber-500 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all mt-auto w-max">
                  Read Article <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
