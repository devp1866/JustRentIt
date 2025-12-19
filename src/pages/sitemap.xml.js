import dbConnect from '../utils/db';
import Property from '../models/Property';

const EXTERNAL_DATA_URL = 'https://justrentit.vercel.app';

function generateSiteMap(properties) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!--Static Pages-->
     <url>
       <loc>${EXTERNAL_DATA_URL}</loc>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/about</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/contact</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/properties</loc>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/help-center</loc>
     </url>

     <!--Dynamic Property Pages-->
     ${properties
      .map(({ _id }) => {
        return `
       <url>
           <loc>${EXTERNAL_DATA_URL}/property-details/${_id}</loc>
           <changefreq>weekly</changefreq>
           <priority>0.8</priority>
       </url>
     `;
      })
      .join('')}
   </urlset>
 `;
}

export async function getServerSideProps({ res }) {
  await dbConnect();
  // Fetch all active properties
  const properties = await Property.find({}).select('_id');

  const sitemap = generateSiteMap(properties);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default function SiteMap() {
  // getServerSideProps will do the heavy lifting
  return null;
}
