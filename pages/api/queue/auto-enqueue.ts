import type { NextApiRequest, NextApiResponse } from 'next';
import { addToQueue } from '@/lib/queue';

/**
 * Hard-coded list of Christmas songs from the playlist
 * Playlist: https://www.youtube.com/playlist?list=PLeDakahyfrO_xD3xuEkFjhTQEIH9rqC7p
 */
const PLAYLIST_VIDEOS = [
  '0bhsXykXxfg', // Michael Bublé - It's Beginning to Look a Lot Like Christmas
  'yXQViqx6GMY', // Mariah Carey - All I Want For Christmas Is You
  '1d8LHxByxRU', // Brenda Lee - Rockin' Around The Christmas Tree
  'E8gmARGvPlI', // Wham! - Last Christmas
  'gset79KMmt0', // Sia - Snowman
  'Qe1Bj7qIang', // Jingle Bell Rock
  'Dkq3LD-4pmM', // Michael Bublé - Holly Jolly Christmas
  'PPcpd-YBlGw', // Kelly Clarkson & Ariana Grande - Santa, Can't You Hear Me
  'AN_R4pR1hck', // Andy Williams - It's the Most Wonderful Time of the Year
  '-Z6AnCRjWX0', // Cher - DJ Play a Christmas Song
  'j9jbdgZidu8', // The Pogues - Fairytale Of New York
  'Rnil5LyK_B0', // Dean Martin - Let It Snow! Let It Snow! Let It Snow!
  'uSjq7x67kzM', // Chris Rea - Driving Home For Christmas
  'IJPc7esgvsA', // Wizzard - I Wish It Could Be Christmas Everyday
  '4eY3SfWYI4I', // The Tenors - Feliz Navidad
  'Q_yuO8UNGmY', // Ed Sheeran & Elton John - Merry Christmas
  'DkXIJe8CaIc', // The Ronettes - Sleigh Ride
  '7Rv3wfwIVBc', // Eagles - Please Come Home For Christmas
  'wKhRnZZ0cJI', // Nat King Cole - The Christmas Song
  'nlR0MkrRklg', // Ariana Grande - Santa Tell Me
  'bQ6LIS6m8qE', // White Christmas - The Drifters
  'z1rYmzQ8C9Q', // Coldplay - Christmas Lights
  'LUjn3RpkcKY', // Justin Bieber - Mistletoe
  '94Ye-3C1FC8', // Paul McCartney - Wonderful Christmastime
  '8gWHlHWIaRQ', // Happy Xmas (War Is Over) - John Lennon
  '5W6Is98o510', // Ava Max - Christmas Without You
  'YfF10ow4YEo', // Kelly Clarkson - Underneath the Tree
  'hLf0-lro8X8', // Frank Sinatra - Jingle Bells
  'r7dhSn8bnLg', // Santa Claus Is Coming to Town - Kylie Minogue feat. Frank Sinatra
  'fvNC-kPKWqQ', // Teddy Swims - Silent Night
  'hJw-ey1DPRA', // Josh Groban - O Holy Night
  'GhRJJ0PEXVc', // Sam Ryder - You're Christmas To Me
  'kORRidv-p0Y', // Nat King Cole - Deck The Halls
  'y1R4t5xfvO4', // Kylie Minogue - Santa Baby
  '3KK6sMo8NBY', // Elvis Presley, Martina McBride - Blue Christmas
  'N-PyWfVkjZc', // Shakin' Stevens - Merry Christmas Everyone
  '4QJKhKNWy5o', // Dan + Shay - Take Me Home For Christmas
  'YiadNVhaGwk', // Chuck Berry - Run Rudolph Run
  'JhcLpwlA-ZA', // Here Comes Santa Claus - Gene Autry
  'eH8fEgMF7WQ', // The Tenors - I've Got My Love to Keep Me Warm
  'oIKt5p3UmXg', // Michael Bublé - Winter Wonderland
  'LRP8d7hhpoQ', // Pentatonix - Hallelujah
  '3ZT9_H4-hbM', // Gwen Stefani - You Make It Feel Like Christmas ft. Blake Shelton
  'Oswkllz_Lvs', // Donny Hathaway - This Christmas
  'l3l83C-we-k', // Michael Bublé - Have Yourself A Merry Little Christmas
  'iM-n3s6SD2U', // Griff - Pure Imagination
  'IbRtGMm96F8', // Elton John - Step Into Christmas
  '4pPpxsbqxR8', // Kylie Minogue - It's The Most Wonderful Time Of The Year
  '-iZGh91-v7Y', // Michael Bublé - Silent Night
  'ZzUgaMbe_0Q', // Cher - Christmas (Baby Please Come Home)
  'V3EYjVPRClU', // Sia - Santa's Coming For Us
  '6bbuBubZ1yE', // Idina Menzel & Michael Bublé - Baby It's Cold Outside
  'oZ5cmrz-mrU', // Andy Williams - Happy Holiday / The Holiday Season
  '_MzumcY3lpk', // Britney Spears - My Only Wish (This Year)
  '0FTMpAEHz1Q', // Maisie Peters - Together This Christmas
  'qw2TD91Nytg', // Queen - Thank God It's Christmas
  'GqUp5K_sHd0', // Dan + Shay - Officially Christmas
  'O89sPooBhyE', // Jackson 5 - I Saw Mommy Kissing Santa Claus
  'wKj92352UAE', // *NSYNC - Merry Christmas, Happy Holidays
  'NJ6kJ7GWtv0', // Mud - Lonely This Christmas
  'EqHzjDBXSFI', // John Legend - What Christmas Means to Me ft. Stevie Wonder
  'MaA7B9cu4kU', // Stevie Wonder, Andra Day - Someday At Christmas
  'fMAlTDQT_9k', // Michael Bublé, Carly Pearce - Maybe This Christmas
  'wYJCB6pGz-c', // Ella Henderson & Cian Ducrot - Rest Of Our Days
  'rZCEBibnRM8', // Cliff Richard - Mistletoe and Wine
  'Vs9FPx3_Slk', // Bing Crosby - Do You Hear What I Hear?
  'mBycW6iu8GM', // Michael Bublé - Christmas (Baby Please Come Home)
  'nBCkXe3ZfoI', // Ed Sheeran - Under the Tree
  'jgAZVgfUxcg', // Nat King Cole - Joy To The World
  '-wNhdjoF-6M', // East 17 - Stay Another Day
  'ydhiAOt9364', // christina perri - merry christmas darling
  '30TkClWvT5k', // Michael Bublé - White Christmas ft. Shania Twain
  'ByK84WFMaJw', // Twenty One Pilots - Christmas Saves The Year
  'M2b6O30TtBo', // Luis Miguel - Santa Claus Llego A La Ciudad
  'lPzh8fX2leM', // Lea Heart - Everybody's Home For Christmas
  '2LbmhneqBnE', // Trans-Siberian Orchestra - Christmas Eve / Sarajevo 12/24
  '0yhI35F2NB0', // Michael Bublé - I'll Be Home For Christmas
  'f22j1cRUXBE', // oíche chiúin (silent night) - amy michelle
  '7oTdKkytYK8', // Bing Crosby - The Little Drummer Boy
  'hmRkwbFOFVQ', // VICTORIA x Aleksander Dębicz - All I Want For Christmas Is You
  'PTslBTBl1X8', // Slade - Merry Xmas Everybody
  'Rpg7-ab_F7s', // Brett Eldredge - Baby It's Cold Outside feat. Meghan Trainor
  'GAs67cRfmQI', // You're A Mean One, Mr. Grinch - Tyler, The Creator
  '0G7HpFyEBVM', // Ava Max - 1 Wish
  'g7KkM9iDj7s', // Crash Adams - Good All Year
  'ElmsIGT85tI', // Sia - Candy Cane Lane
  'DnAFX3pvZaY', // Blake Shelton - Jingle Bell Rock
  'KnbqzkC3i9k', // Kelly Clarkson and Brett Eldredge - Under The Mistletoe
  'AEyGZlBdkaA', // Pretenders - 2000 Miles
  'pFjdfjrtf1Q', // Pentatonix - That's Christmas to Me
  'Q49o_VQg8C4', // Bing Crosby - Frosty The Snowman
  'P1qXL1cEgi4', // Where Are You Christmas - Faith Hill
  'im2JjOhTW80', // Michael Bublé - Blue Christmas
  '9UwpVfZ_LPY', // Nat King Cole - O Come All Ye Faithful
  'n_OuJnQnwFE', // Anne-Marie - Think of Christmas
  '3Avycrez66o', // Believe - Josh Groban
  'TShCxqvqE3s', // Cher - What Christmas Means to Me with Stevie Wonder
  'vmiAeIOsugQ', // Christmas Wish - Percy Sledge
].map(id => `https://www.youtube.com/watch?v=${id}`);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    if (PLAYLIST_VIDEOS.length === 0) {
      return res.status(500).json({ error: 'No videos found in playlist' });
    }
    
    // Select a random video
    const randomIndex = Math.floor(Math.random() * PLAYLIST_VIDEOS.length);
    const randomVideo = PLAYLIST_VIDEOS[randomIndex];
    
    // Add to queue with a system username
    const entry = await addToQueue(randomVideo, '🤖 Auto-DJ');
    
    res.status(201).json({
      success: true,
      entry,
      message: 'Random song auto-enqueued',
    });
  } catch (error) {
    console.error('Error auto-enqueueing:', error);
    res.status(500).json({ error: 'Failed to auto-enqueue video' });
  }
}
