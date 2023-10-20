export const getContent = (code: string, dynamic: string) => {
  const startMarker = dynamic;
  const endMarker = dynamic;

  const startIndex = code.indexOf(startMarker);
  const endIndex = code.lastIndexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const contentWithMarkers = code.substring(startIndex, endIndex + endMarker.length);
    const resCodeContent = contentWithMarkers.substring(startMarker.length, contentWithMarkers.length - endMarker.length).trim();

    return resCodeContent
  } else {
    console.log('Markers not found in the code.');
  }
}