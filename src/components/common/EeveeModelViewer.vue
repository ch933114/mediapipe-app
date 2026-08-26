<script setup lang="ts">
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import {
    AmbientLight,
    Box3,
    Clock,
    Color,
    DirectionalLight,
    Group,
    MathUtils,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
  } from "three";

  type EeveeModelViewerProps = {
    modelUrl: string;
  };

  const props = defineProps<EeveeModelViewerProps>();

  const emit = defineEmits<{
    error: [message: string];
  }>();

  const containerElement = ref<HTMLDivElement | null>(null);
  const isLoading = ref(true);
  const errorMessage = ref("");

  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let modelGroup: Group | null = null;
  let modelPivotGroup: Group | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let animationFrameId = 0;
  let clock: Clock | null = null;
  let modelBaseY = 0;
  let isCompactViewport = false;
  let modelFloatAmplitude = 0.08;
  let modelFloatSpeed = 1.25;
  let modelRotateSpeed = 0.9;
  let modelBoundsSize: Vector3 | null = null;

  function resolveCompactViewport() {
    return window.matchMedia("(width <= 640px)").matches;
  }

  function syncRendererSize() {
    const container = containerElement.value;

    if (!container || !renderer || !camera) return;

    const { clientWidth, clientHeight } = container;

    if (!clientWidth || !clientHeight) return;

    renderer.setSize(clientWidth, clientHeight, true);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();

    if (modelBoundsSize) {
      focusCamera(modelBoundsSize);
    }
  }

  function normalizeModel(targetModel: Group) {
    const initialBounds = new Box3().setFromObject(targetModel);
    const initialSize = initialBounds.getSize(new Vector3());
    const maxAxis = Math.max(initialSize.x, initialSize.y, initialSize.z);

    if (!maxAxis) return null;

    const targetSize = isCompactViewport ? 2 : 2.35;
    const scale = targetSize / maxAxis;

    // Normalize model size / 正規化模型尺寸
    targetModel.scale.setScalar(scale);

    const normalizedBounds = new Box3().setFromObject(targetModel);
    const normalizedCenter = normalizedBounds.getCenter(new Vector3());
    const normalizedSize = normalizedBounds.getSize(new Vector3());

    targetModel.position.x -= normalizedCenter.x;
    targetModel.position.y -= normalizedCenter.y - normalizedSize.y * 0.08;
    targetModel.position.z -= normalizedCenter.z;

    return normalizedSize;
  }

  function focusCamera(targetSize: Vector3) {
    if (!camera) return;

    const verticalFov = MathUtils.degToRad(camera.fov);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const widthDistance = targetSize.x / (2 * Math.tan(horizontalFov / 2));
    const heightDistance = targetSize.y / (2 * Math.tan(verticalFov / 2));
    const depthDistance = targetSize.z * 1.55;
    const fitPadding = isCompactViewport ? 1.95 : 1.55;
    const distance =
      Math.max(widthDistance, heightDistance, depthDistance) * fitPadding;

    camera.position.set(
      0,
      targetSize.y * (isCompactViewport ? 0.2 : 0.32),
      distance
    );
    camera.lookAt(0, targetSize.y * 0.08, 0);
    camera.near = 0.1;
    camera.far = Math.max(100, distance * 8);
    camera.updateProjectionMatrix();
  }

  async function setupScene() {
    const container = containerElement.value;

    if (!container) return;

    scene = new Scene();
    scene.background = new Color("#090c14");

    camera = new PerspectiveCamera(36, 1, 0.1, 100);
    isCompactViewport = resolveCompactViewport();
    modelRotateSpeed = isCompactViewport ? 0.75 : 0.9;
    modelFloatSpeed = isCompactViewport ? 1 : 1.25;
    modelFloatAmplitude = isCompactViewport ? 0.035 : 0.08;

    renderer = new WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isCompactViewport ? 1.5 : 2)
    );
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    container.replaceChildren(renderer.domElement);

    const ambientLight = new AmbientLight("#fff4dc", 2.2);
    const keyLight = new DirectionalLight("#ffd8ab", 2.8);
    const rimLight = new DirectionalLight("#8be9ff", 1.8);

    keyLight.position.set(3.2, 4.6, 5.4);
    rimLight.position.set(-4.4, 2.1, -3.5);

    scene.add(ambientLight, keyLight, rimLight);

    syncRendererSize();

    resizeObserver = new ResizeObserver(() => {
      syncRendererSize();
    });
    resizeObserver.observe(container);

    clock = new Clock();

    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(props.modelUrl);

    modelGroup = gltf.scene;
    modelBoundsSize = normalizeModel(modelGroup);

    if (!modelBoundsSize) {
      throw new Error("3D 模型尺寸計算失敗");
    }

    modelPivotGroup = new Group();
    modelPivotGroup.add(modelGroup);
    focusCamera(modelBoundsSize);
    modelBaseY = modelPivotGroup.position.y;
    scene.add(modelPivotGroup);

    isLoading.value = false;

    const renderFrame = () => {
      if (!renderer || !scene || !camera || !modelPivotGroup || !clock) {
        return;
      }

      const elapsedTime = clock.getElapsedTime();

      modelPivotGroup.rotation.y = elapsedTime * modelRotateSpeed;
      modelPivotGroup.position.y =
        modelBaseY +
        Math.sin(elapsedTime * modelFloatSpeed) * modelFloatAmplitude;

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }

  function teardownScene() {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }

    resizeObserver?.disconnect();
    resizeObserver = null;

    modelGroup?.traverse((node) => {
      const mesh = node as {
        geometry?: { dispose?: () => void };
        material?: { dispose?: () => void } | Array<{ dispose?: () => void }>;
      };

      mesh.geometry?.dispose?.();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose?.());
        return;
      }

      mesh.material?.dispose?.();
    });

    renderer?.dispose();
    containerElement.value?.replaceChildren();

    renderer = null;
    scene = null;
    camera = null;
    modelGroup = null;
    modelPivotGroup = null;
    clock = null;
    modelBaseY = 0;
    modelBoundsSize = null;
  }

  onMounted(async () => {
    try {
      await setupScene();
    } catch (error) {
      isLoading.value = false;
      errorMessage.value =
        error instanceof Error ? error.message : "3D 模型載入失敗";
      emit("error", errorMessage.value);
      teardownScene();
    }
  });

  onBeforeUnmount(() => {
    teardownScene();
  });
</script>

<template>
  <div class="eevee-model-viewer">
    <div ref="containerElement" class="eevee-model-viewer-canvas" />

    <div v-if="isLoading" class="eevee-model-viewer-overlay">
      正在載入 3D 伊布模型...
    </div>

    <div v-else-if="errorMessage" class="eevee-model-viewer-overlay">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
  .eevee-model-viewer {
    @apply relative h-full min-h-[18rem] w-full max-w-full overflow-hidden rounded-[20px];
    max-height: min(20rem, 78vw);
    background:
      radial-gradient(circle at top, rgb(255 244 213 / 42%), transparent 38%),
      linear-gradient(180deg, rgb(255 255 255 / 16%), rgb(12 14 22 / 90%));
  }

  .eevee-model-viewer-canvas {
    @apply h-full w-full max-w-full;
    max-height: 100%;
  }

  .eevee-model-viewer-overlay {
    @apply absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/75;
  }

  @media (width <= 640px) {
    .eevee-model-viewer {
      min-height: clamp(13rem, 62vw, 17rem);
      max-height: clamp(13rem, 62vw, 17rem);
    }
  }
</style>
