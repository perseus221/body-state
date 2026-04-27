export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

  try {
    // 1. refresh token으로 새 access token 발급
    const tokenRes = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. 최근 라이딩 가져오기
    const actRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const activities = await actRes.json();

    const rides = activities
      .filter(a => a.type === 'Ride' || a.sport_type === 'Ride')
      .slice(0, 8)
      .map(a => ({
        id: a.id,
        name: a.name,
        date: a.start_date_local,
        dist: parseFloat((a.distance / 1000).toFixed(1)),
        time: parseFloat((a.moving_time / 3600).toFixed(1)),
        elev: Math.round(a.total_elevation_gain),
        kcal: Math.round((a.kilojoules || 0) * 0.239),
      }));

    res.status(200).json({ rides });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
