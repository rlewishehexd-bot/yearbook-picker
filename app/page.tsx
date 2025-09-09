'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const photos = [
  '/photo1.jpg',
  '/photo2.jpg',
  '/photo3.jpg',
  '/photo4.jpg',
  '/photo5.jpg',
  '/photo6.jpg',
];

const ivyGreen = '#1B4D3E';
const ivyMutedGreen = '#3D6654';

export default function YearbookPickerPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const baseGap = 24;
  const basePadding = 24;
  const titleFont = 32;
  const sectionFont = 18;
  const maxContentWidth = 1200;
  const maxColumnWidth = 500;

  return (
    <div className="w-screen min-h-screen flex flex-col items-center bg-gradient-to-b from-white to-zinc-50 p-6">
      {/* Main content container */}
      <div
        className="flex flex-col md:flex-row w-full p-4"
        style={{
          maxWidth: `${maxContentWidth}px`,
          gap: `${baseGap}px`,
          borderRadius: '1rem',
          backgroundColor: 'white',
        }}
      >
        {/* Left Column */}
        <div className="flex-1 flex flex-col justify-center md:justify-start items-center md:items-start">
          <h1
            className="font-extrabold text-center mx-auto md:mx-0"
            style={{
              fontSize: titleFont,
              marginBottom: `${baseGap}px`,
              maxWidth: `${maxColumnWidth}px`,
              color: ivyGreen,
            }}
          >
            Yearbook Picture Tool
          </h1>

          {/* Selected Photo */}
          <div
            className="bg-white rounded-2xl flex flex-col items-center w-full relative"
            style={{
              padding: `${basePadding}px`,
              maxWidth: `${maxColumnWidth}px`,
              border: `2px solid ${ivyGreen}`,
              boxShadow: `0 10px 15px -3px ${ivyGreen}33, 0 4px 6px -2px ${ivyGreen}22`,
            }}
          >
            <div
              className={`w-full aspect-[4/5] overflow-hidden rounded-lg cursor-pointer
                ${selected ? 'ring-2 ring-green-400' : ''}`}
              onClick={() => selected && setSelected(selected)}
            >
              {selected ? (
                <div className="relative w-full h-full">
                  <img
                    src={selected}
                    alt="Selected"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-1 right-1 rounded-full p-1 bg-white flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-center"
                  style={{ fontSize: sectionFont, color: ivyMutedGreen }}
                >
                  No Photo Selected
                </div>
              )}
            </div>
            <h2
              className="font-semibold mt-3"
              style={{ fontSize: sectionFont, color: ivyGreen }}
            >
              Selected Photo
            </h2>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col flex-1" style={{ gap: `${baseGap}px` }}>
            {/* Photo Gallery */}
            <div
              className="bg-white rounded-2xl flex flex-col p-4 flex-[2]"
              style={{
                border: `2px solid ${ivyGreen}`,
                boxShadow: `0 10px 15px -3px ${ivyGreen}33, 0 4px 6px -2px ${ivyGreen}22`,
              }}
            >
              <h2
                className="font-bold mb-3"
                style={{ fontSize: sectionFont, color: ivyGreen }}
              >
                Photo Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 place-items-center flex-1">
                {photos.map((photo) => (
                  <div
                    key={photo}
                    className={`relative cursor-pointer w-full h-full rounded-lg
                      ${selected === photo ? 'ring-2 ring-green-400' : ''} 
                      hover:ring-2 hover:ring-green-400 transition-all`}
                    onClick={() => setSelected(photo)}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail of ${photo}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {selected === photo && (
                      <div className="absolute top-1 right-1 rounded-full p-1 bg-white flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Box */}
            <div
              className="bg-white rounded-2xl flex flex-col items-center justify-center p-4 flex-[1]"
              style={{
                border: `2px solid ${ivyGreen}`,
                boxShadow: `0 10px 15px -3px ${ivyGreen}33, 0 4px 6px -2px ${ivyGreen}22`,
              }}
            >
              {selected ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <p
                    className="text-center italic"
                    style={{ fontSize: sectionFont, color: ivyMutedGreen }}
                  >
                    Press confirm to finalize this photo.
                  </p>

                  <button
                    className="rounded-full px-6 py-2 font-semibold transition-all duration-150"
                    style={{
                      backgroundColor: 'green',
                      color: 'whitesmoke',
                      cursor: 'pointer',
                      fontWeight: 600,
                      boxShadow: '0 0 0 rgba(0,0,0,0)',
                    }}
                    onMouseDown={(e) =>
                      (e.currentTarget.style.boxShadow =
                        'inset 0 4px 8px rgba(0,0,0,0.3)')
                    }
                    onMouseUp={(e) =>
                      (e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)')
                    }
                    onClick={() => console.log(`Photo ${selected} confirmed!`)}
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <p
                  className="text-center"
                  style={{ fontSize: sectionFont, color: ivyMutedGreen }}
                >
                  👉 Choose a photo from the gallery above.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
