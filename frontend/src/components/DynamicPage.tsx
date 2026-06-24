import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft } from 'lucide-react';

interface DynamicPageProps {
  slug: string;
  onBack: () => void;
}

export default function DynamicPage({ slug, onBack }: DynamicPageProps) {
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'pages'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setPageData({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        } else {
          setPageData(null);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">The page you are looking for does not exist.</p>
        <button onClick={onBack} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
            {pageData.title}
          </h1>
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
            {pageData.content}
          </div>
        </article>
      </div>
    </div>
  );
}
