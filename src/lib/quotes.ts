// Daily rotating inspirational quote for the dashboard header. Picked
// deterministically from the day of year (not Math.random()) so the same
// quote shows all day for everyone loading the dashboard, and it moves on
// to the next one at midnight. The list repeats after it's exhausted.
//
// Themed around manifesting your dreams / believing in what you're
// building (Jacob's ask), rather than pure hard-nosed business grind —
// fits a ceremonial-cacao, intention-forward brand better than generic
// "startup hustle" quotes.
export type DailyQuote = {
  text: string;
  author: string;
};

export const DAILY_QUOTES: DailyQuote[] = [
  { text: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney" },
  { text: "Whatever the mind can conceive and believe, it can achieve.", author: "Napoleon Hill" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "You are what your deep, driving desire is. As your desire is, so is your will. As your will is, so is your deed.", author: "The Upanishads" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The universe is not outside of you. Look inside yourself; everything that you want, you already are.", author: "Rumi" },
  { text: "Dreams are today's answers to tomorrow's questions.", author: "Edgar Cayce" },
  { text: "If you can dream it, you can do it.", author: "Walt Disney" },
  { text: "Change your thoughts and you change your world.", author: "Norman Vincent Peale" },
  { text: "You get in life what you have the courage to ask for.", author: "Oprah Winfrey" },
  { text: "Set your intentions and let the universe figure out how.", author: "Gabrielle Bernstein" },
  { text: "The moment you doubt whether you can fly, you cease forever being able to do it.", author: "J.M. Barrie" },
  { text: "Ask for what you want and be prepared to get it.", author: "Maya Angelou" },
  { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
  { text: "You are confined only by the walls you build yourself.", author: "Andrew Murphy" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "I am the greatest, I said that even before I knew I was.", author: "Muhammad Ali" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Your visions will become clear only when you can look into your own heart.", author: "Carl Jung" },
  { text: "The world is but a canvas to our imagination.", author: "Henry David Thoreau" },
  { text: "Once you make a decision, the universe conspires to make it happen.", author: "Ralph Waldo Emerson" },
  { text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },
  { text: "You are the sky. Everything else is just the weather.", author: "Pema Chödrön" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "The energy of the mind is the essence of life.", author: "Aristotle" },
  { text: "Whatever you can do or dream you can, begin it. Boldness has genius, power, and magic in it.", author: "Johann Wolfgang von Goethe" },
  { text: "Miracles happen every day, not just in remote places but in your own heart and soul.", author: "Deepak Chopra" },
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { text: "Gratitude turns what we have into enough.", author: "Melody Beattie" },
  { text: "The soul that sees beauty may sometimes walk alone.", author: "Johann Wolfgang von Goethe" },
  { text: "The wound is the place where the light enters you.", author: "Rumi" },
  { text: "Faith is taking the first step even when you don't see the whole staircase.", author: "Martin Luther King Jr." },
  { text: "Every thought we think is creating our future.", author: "Louise Hay" },
  { text: "Your intuition knows what to write, so get out of the way.", author: "Ray Bradbury" },
  { text: "What we plant in the soil of contemplation, we shall reap in the harvest of action.", author: "Meister Eckhart" },
  { text: "You have been given this life because you are strong enough to live it.", author: "Unknown" },
  { text: "The only journey is the one within.", author: "Rainer Maria Rilke" },
  { text: "As within, so without. As above, so below.", author: "Hermetic principle" },
];

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getQuoteOfTheDay(date: Date = new Date()): DailyQuote {
  const index = dayOfYear(date) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
