function autoComplete(input, latInput, lngInput) {
  if (!input) return; // skip function if no input
  const dropdown = new google.maps.places.Autocomplete(input);

  // part of the Google api library
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });
  // prevent enter from allowing form submit on address dropdown
  // .on takes advantage of Bling.js
  input.on('keydown', (e) => {
    if (e.keyCode === 13) e.preventDefault();
  });
}

export default autoComplete;
