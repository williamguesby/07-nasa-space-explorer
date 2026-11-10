
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const dateForm = document.getElementById('dateForm');
const searchButton = document.getElementById('searchButton');
const gallery = document.getElementById('gallery');
const galleryStatus = document.getElementById('galleryStatus');
const photoDialog = document.getElementById('photoDialog');
const dialogImage = document.getElementById('dialogImage');
const dialogDate = document.getElementById('dialogDate');
const dialogTitle = document.getElementById('dialogTitle');
const dialogExplanation = document.getElementById('dialogExplanation');

// NASA's public demo key works without exposing a personal API key
const apiKey = 'DEMO_KEY';

// Random space facts
const spaceFacts = [
    'Sunlight takes about 8 minutes and 20 seconds to reach Earth.',
    'A day on Venus is longer than its year.',
    'Footprints left on the Moon can last for millions of years.',
    'Saturn is so low in density that it would float in a giant bathtub.',
    'The International Space Station orbits Earth about every 90 minutes.',
    'Neutron stars can spin hundreds of times every second.'
];

document.getElementById('spaceFact').textContent =
    spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

// Keep the starter project's date validation
setupDateInputs(startInput, endInput);

// Convert HTML-formatted NASA text into plain text
function plainText(value) {
    const element = document.createElement('div');
    element.innerHTML = String(value || '');
    return element.textContent.trim();
}

// Find a usable image URL without treating NASA pages as images
function getImageUrl(photo) {
    const candidates = [
        photo.hdurl,
        photo.image_url,
        photo.image,
        photo.thumbnail_url
    ];

    // Older API responses may provide a direct image in url
    if (photo.url && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(photo.url)) {
        candidates.push(photo.url);
    }

    return candidates.find(url =>
        typeof url === 'string' && url.startsWith('https://')
    ) || '';
}

// Find the APOD webpage for an entry
function getPageUrl(photo) {
    if (photo.permalink) return photo.permalink;

    if (photo.url && !/\.(jpg|jpeg|png|webp)(\?|$)/i.test(photo.url)) {
        return photo.url;
    }

    return `https://apod.nasa.gov/apod/`;
}

// Fetch the selected NASA entries
dateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const startDate = startInput.value;
    const endDate = endInput.value;

    if (!startDate || !endDate || startDate > endDate) {
        galleryStatus.textContent =
            'Please choose a valid start and end date.';
        return;
    }

    const rangeLength =
        (Date.parse(endDate) - Date.parse(startDate)) / 86400000 + 1;

    if (rangeLength > 100) {
        galleryStatus.textContent =
            'Please choose a range of 100 days or fewer.';
        return;
    }

    searchButton.disabled = true;
    searchButton.querySelector('span').textContent = 'Loading images';
    galleryStatus.textContent = 'Loading space photos...';
    gallery.replaceChildren();

    try {
        const apiUrl =
            `https://science.nasa.gov/wp-json/wp/v2/apod-basic?api_key=${encodeURIComponent(apiKey)}&start_date=${startDate}&end_date=${endDate}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(
                `NASA API request failed (error ${response.status}).`
            );
        }

        const result = await response.json();

        console.log('NASA APOD response:', result);

        // Accept arrays and common wrapped response structures
        const photos = Array.isArray(result)
            ? result
            : Array.isArray(result.items)
                ? result.items
                : Array.isArray(result.data)
                    ? result.data
                    : result.date
                        ? [result]
                        : [];

        photos.sort((a, b) =>
            String(a.date).localeCompare(String(b.date))
        );

        if (photos.length === 0) {
            galleryStatus.textContent =
                'No APOD entries were returned for these dates.';
            return;
        }

        photos.forEach(photo => {
            gallery.appendChild(createPhotoCard(photo));
        });

        galleryStatus.textContent =
            `${photos.length} ${photos.length === 1 ? 'day' : 'days'} from the cosmos`;

    } catch (error) {
        console.error('NASA API error:', error);
        galleryStatus.textContent =
            error.message || 'Unable to load NASA images.';

    } finally {
        searchButton.disabled = false;
        searchButton.querySelector('span').textContent =
            'Get space images';
    }
});

// Create each gallery card
function createPhotoCard(photo) {
    const card = document.createElement('article');
    card.className = 'gallery-item';

    const imageUrl = getImageUrl(photo);
    const isVideo = photo.media_type === 'video';

    if (!isVideo && imageUrl) {
        const imageButton = document.createElement('button');
        imageButton.className = 'image-button';
        imageButton.type = 'button';

        imageButton.setAttribute(
            'aria-label',
            `View ${plainText(photo.title)}`
        );

        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = plainText(photo.title) || 'NASA astronomy image';
        image.loading = 'lazy';

        imageButton.appendChild(image);

        imageButton.addEventListener('click', () => {
            openPhotoDetails(photo);
        });

        card.appendChild(imageButton);

    } else {
        const videoLink = document.createElement('a');
        videoLink.className = 'video-preview';
        videoLink.href = getPageUrl(photo);
        videoLink.target = '_blank';
        videoLink.rel = 'noopener noreferrer';

        videoLink.setAttribute(
            'aria-label',
            `View ${plainText(photo.title)} on NASA`
        );

        if (photo.thumbnail_url) {
            const thumbnail = document.createElement('img');
            thumbnail.src = photo.thumbnail_url;
            thumbnail.alt = '';
            thumbnail.loading = 'lazy';
            videoLink.appendChild(thumbnail);
        }

        const label = document.createElement('span');
        label.className = 'video-label';
        label.textContent = isVideo
            ? '▶ WATCH VIDEO'
            : 'VIEW ON NASA';

        videoLink.appendChild(label);
        card.appendChild(videoLink);
    }

    const cardCopy = document.createElement('div');
    cardCopy.className = 'card-copy';

    const date = document.createElement('p');
    date.className = 'card-date';
    date.textContent = formatDate(photo.date);

    const title = document.createElement('h3');
    title.textContent = plainText(photo.title) || 'Astronomy Picture of the Day';

    cardCopy.append(date, title);
    card.appendChild(cardCopy);

    return card;
}

// Open the image details modal
function openPhotoDetails(photo) {
    dialogImage.src = getImageUrl(photo);
    dialogImage.alt = plainText(photo.title);

    dialogDate.textContent = formatDate(photo.date);
    dialogTitle.textContent = plainText(photo.title);
    dialogExplanation.textContent = plainText(photo.explanation);

    photoDialog.showModal();
}

// Format the date
function formatDate(date) {
    if (!date) return 'Date unavailable';

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return String(date);
    }

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Close modal
document.getElementById('closeDialog').addEventListener(
    'click',
    () => photoDialog.close()
);

// Close modal by clicking outside
photoDialog.addEventListener('click', (event) => {
    if (event.target === photoDialog) {
        photoDialog.close();
    }
});
