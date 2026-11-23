# BRYSS — Multidisciplinary Artist Portfolio & Dashboard

A responsive, dark editorial portfolio website for multidisciplinary artist **Bryss** (Murals, Wearable Art / Sculpture, Photography, Videography & Film), paired with an instant **Artist Dashboard** powered by a zero-dependency local Node server (or Supabase in production).

---

## 📁 Project Structure

```text
bryss-portfolio/
├── server.js             # Zero-dependency local Node server (runs in 0.1s)
├── index.html            # Public portfolio homepage
├── styles.css            # Public styling & animations
├── script.js             # Public gallery, filters, lightbox & contact logic
├── admin.html            # Private artist dashboard
├── admin.css             # Dashboard styling
├── admin.js              # Dashboard logic (local server API + Supabase ready)
├── supabase-config.js    # Supabase credentials (optional for cloud hosting)
├── supabase-setup.sql    # Database schema & storage bucket policies for Supabase
├── data/
│   └── artworks.json     # Local database storing all portfolio projects
├── assets/               # Local artwork images
│   ├── chungaa-video.png        # CHUNGAA music video project cover
│   ├── one-piece-denim-art.jpeg # Hand-painted One Piece anime custom denim
│   └── uploads/                 # User-uploaded artwork images
└── README.md             # Documentation and setup instructions
```

---

## 🚀 How to Run the Website (Instant Local Server)

You already have Node.js installed! To start the server:

1. Open PowerShell or Terminal in `D:\frappe-project\bryss-portfolio`:
   ```powershell
   node server.js
   ```

2. Open your browser:
   - **Public Website:** [`http://localhost:3000`](http://localhost:3000)
   - **Artist Dashboard:** [`http://localhost:3000/admin.html`](http://localhost:3000/admin.html)

3. **Sign In to Dashboard:**
   - Email: `artist@bryss.studio` (or your email)
   - Password: `bryss` (or any password with 3+ characters)
   - You can immediately upload images, edit descriptions, add video links, and publish/draft projects! All uploaded files are saved into `assets/uploads/` and synced with `data/artworks.json`.

---

## ☁️ Optional: Moving to Supabase Later

If you decide to deploy to a cloud database later:
1. Run the SQL script from [`supabase-setup.sql`](file:///D:/frappe-project/bryss-portfolio/supabase-setup.sql) in your Supabase SQL Editor.
2. Put your Supabase URL and anon key into [`supabase-config.js`](file:///D:/frappe-project/bryss-portfolio/supabase-config.js).
3. The site will automatically switch to Supabase Cloud mode!
