export default function () {

    // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
    // Only enable it if you actually need to.
    var renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);

    // Append the canvas element created by the renderer to document body element.
    document.body.appendChild(renderer.domElement);

    // Create a three.js scene.
    var scene = new THREE.Scene();

    // Create a three.js camera.
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    // Apply VR headset positional data to camera.
    var controls = new THREE.VRControls(camera);
    controls.standing = true;

    // Apply VR stereo rendering to renderer.
    var effect = new THREE.VREffect(renderer);
    effect.setSize(window.innerWidth, window.innerHeight);

    // Add a texture to the skysphere.
    var loader = new THREE.TextureLoader();
    loader.load('/images/sphere.jpg', onSpheremapTextureLoad);

    function onSpheremapTextureLoad(texture) {
        var geometry = new THREE.SphereGeometry(100, 32, 32);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
            //color: 0x01BE00,
            side: THREE.BackSide
        });

        // Align the skysphere to the floor (which is at y=0).
        var skysphere = new THREE.Mesh(geometry, material);
        skysphere.position.y = 0;
        scene.add(skysphere);

        // For high end VR devices like Vive and Oculus, take into account the stage
        // parameters provided.
        setupStage();
    }

    // Create a VR manager helper to enter and exit VR mode.
    var params = {
        hideButton: false, // Default: false.
        isUndistorted: false // Default: false.
    };
    var manager = new WebVRManager(renderer, effect, params);

    // Create 3D objects.
    var cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var cubeMaterial = new THREE.MeshNormalMaterial();
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // Position cube mesh to be right in front of you.
    cube.position.set(0, controls.userHeight, -1);

    // Add cube mesh to your three.js scene
    scene.add(cube);

    // Kick off animation loop
    requestAnimationFrame(animate);

    window.addEventListener('resize', onResize, true);
    window.addEventListener('vrdisplaypresentchange', onResize, true);

    // Request animation frame loop function
    var lastRender = 0;
    function animate(timestamp) {
        var delta = Math.min(timestamp - lastRender, 500);
        lastRender = timestamp;

        // Apply rotation to cube mesh
        cube.rotation.y += delta * 0.0006;

        // Update VR headset position and apply to camera.
        controls.update();

        // Render the scene through the manager.
        manager.render(scene, camera, timestamp);

        requestAnimationFrame(animate);
    }

    function onResize(e) {
        effect.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    var display;

    // Get the HMD, and if we're dealing with something that specifies
    // stageParameters, rearrange the scene.
    function setupStage() {
        navigator.getVRDisplays().then(function (displays) {
            if (displays.length > 0) {
                console.info('Displays', displays);
                display = displays[0];
                if (display.stageParameters) {
                    console.info('Stage Params', display.stageParameters)
                    setStageDimensions(display.stageParameters);
                }
            }
        });
    }

    function setStageDimensions(stage) {
        // Make the skysphere fit the stage.
        var material = skysphere.material;
        scene.remove(skysphere);

        // Size the skysphere according to the size of the actual stage.
        var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
        skysphere = new THREE.Mesh(geometry, material);

        // Place it on the floor.
        skysphere.position.y = boxSize / 2;
        scene.add(skysphere);

        // Place the cube in the middle of the scene, at user height.
        cube.position.set(0, controls.userHeight, 0);
    }
}