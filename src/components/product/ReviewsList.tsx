import { useState, useEffect } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  helpful_count: number;
  created_at: string;
  users?: {
    name: string;
    avatar_url: string;
  };
}

interface ReviewsListProps {
  productId: string;
}

export function ReviewsList({ productId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function loadReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users:user_id (
            name,
            avatar_url
          )
        `)
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setReviews(data);

        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(r => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });
        setRatingDistribution(distribution);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-600">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to review this product</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-gray-600 text-sm">Based on {reviews.length} reviews</p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-8">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>

        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {review.users?.avatar_url ? (
                  <img
                    src={review.users.avatar_url}
                    alt={review.users.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {review.users?.name || 'Anonymous'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-xs text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {review.title && (
                  <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                )}

                <p className="text-gray-700 mb-3">{review.comment}</p>

                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful ({review.helpful_count})</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
