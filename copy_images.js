const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\588f9615-79c1-45db-b0e3-de376aa8399e\\.user_uploaded';
const dstDir = 'D:\\frappe-project\\bryss-portfolio\\assets';

const files = [
  ['media_1795450890201_d7096a7f.jpg', 'portrait-general-mixed-media.jpg'],
  ['media_1795450902738_7abe511b.jpg', 'alien-skeleton-wearable-set.jpg'],
  ['media_1795450942435_38660928.jpg', 'video-coogie-shine.jpg'],
  ['media_1795450956867_743b7179.jpg', 'video-redox-5am.jpg'],
  ['media_1795450972650_2ccc5026.jpg', 'video-coogie-dopamine.jpg'],
  ['media_1795450990878_7032edb3.jpg', 'boondocks-custom-denim.jpg'],
  ['media_1795451029396_83c6cd7d.jpg', 'video-coogie-push.jpg'],
  ['media_1795451092065_efe40a6a.jpg', 'mural-cafe-creamy-tasty.jpg'],
  ['media_1795451185053_5fbdb5ba.jpg', 'one-piece-denim-art.jpeg'],
  ['media_1795451210237_5a6b815d.jpg', 'video-coogie-feelings.jpg'],
  ['media_1795451284068_5557daf6.jpg', 'bob-marley-rasta-portrait.jpg'],
  ['media_1795451311806_ce6ad324.jpg', 'bryss-in-studio-sketching.jpg'],
  ['media_1795451335465_1fde0bb8.jpg', 'the-shepherd-lion-lamb.jpg'],
  ['media_1795451355863_fdbbe87f.jpg', 'the-wanderer-wood-sculpture.jpg'],
  ['media_1795451378629_58778eea.jpg', 'dance-in-motion-airbrush.jpg']
];

for (const [fromName, toName] of files) {
  const src = path.join(srcDir, fromName);
  const dst = path.join(dstDir, toName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`Copied ${fromName} -> ${toName}`);
  } else {
    console.error(`Not found: ${src}`);
  }
}
