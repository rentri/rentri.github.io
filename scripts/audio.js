document.addEventListener('DOMContentLoaded', function() {
    var audio = document.getElementById('background-audio');
    // Play the audio and handle autoplay restrictions
    audio.play().catch(function(error) {
        console.log('Autoplay was prevented:', error);
    });

    // Adjust the audio playback to end 3 seconds earlier
    audio.addEventListener('canplaythrough', function() {
        // Set the end time to 3 seconds before the duration
        var endTime = audio.duration - 3;
        audio.addEventListener('timeupdate', function() {
            if (audio.currentTime >= endTime) {
                audio.currentTime = 0; // Reset to the start
            }
        });
    });
});