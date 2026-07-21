// Daily rotating "inspirational quote" for the dashboard header. Picked
// deterministically from the day of year (not Math.random()) so the same
// quote shows all day for everyone loading the dashboard, and it moves on
// to the next one at midnight. The list repeats after it's exhausted.
export type EntrepreneurQuote = {
  text: string;
  author: string;
};

export const ENTREPRENEUR_QUOTES: EntrepreneurQuote[] = [
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" },
  { text: "If you double the number of experiments you do per year, you're going to double your inventiveness.", author: "Jeff Bezos" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Build something 100 people love, not something 1 million people kind of like.", author: "Brian Chesky" },
  { text: "Don't worry about failure; you only have to be right once.", author: "Drew Houston" },
  { text: "It's fine to celebrate success but it is more important to heed the lessons of failure.", author: "Bill Gates" },
  { text: "Business opportunities are like buses, there's always another one coming.", author: "Richard Branson" },
  { text: "If you are not embarrassed by the first version of your product, you've launched too late.", author: "Reid Hoffman" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Conrad Hilton" },
  { text: "I never dreamed about success. I worked for it.", author: "Estée Lauder" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Do not be embarrassed by your failures, learn from them and start again.", author: "Richard Branson" },
  { text: "You don't learn to walk by following rules. You learn by doing, and by falling over.", author: "Richard Branson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Nothing in this world can take the place of persistence.", author: "Calvin Coolidge" },
  { text: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "There is no shortage of remarkable ideas, what's missing is the will to execute them.", author: "Seth Godin" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Chase the vision, not the money; the money will end up following you.", author: "Tony Hsieh" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "I'm convinced that about half of what separates successful entrepreneurs from the non-successful ones is pure perseverance.", author: "Steve Jobs" },
  { text: "There's no shame in the failure. Just learn from it and press forward.", author: "Ray Dalio" },
  { text: "Every strike brings me closer to the next home run.", author: "Babe Ruth" },
  { text: "Do things that don't scale.", author: "Paul Graham" },
  { text: "The way I like to run a company is that decisions are made by people who have the most detailed and relevant information.", author: "Elon Musk" },
  { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk" },
  { text: "Work like there is someone working 24 hours a day to take it away from you.", author: "Mark Cuban" },
  { text: "Sometimes life hits you in the head with a brick. Don't lose faith.", author: "Steve Jobs" },
  { text: "If you're changing the world, you're working on important things.", author: "Larry Page" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky" },
];

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getQuoteOfTheDay(date: Date = new Date()): EntrepreneurQuote {
  const index = dayOfYear(date) % ENTREPRENEUR_QUOTES.length;
  return ENTREPRENEUR_QUOTES[index];
}
