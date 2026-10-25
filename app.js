
const $ = id => document.getElementById(id);
const files = {};
let currentPath = "Assets/Scripts/Trucks/TruckController.cs";

const starter = {
"Assets/Scripts/Trucks/TruckController.cs": "using UnityEngine;\n\n[RequireComponent(typeof(Rigidbody))]\npublic class TruckController : MonoBehaviour\n{\n    [Header(\"Prototype driving settings\")]\n    public float acceleration = 8f;\n    public float maxSpeed = 28f;\n    public float steeringDegrees = 32f;\n    public float brakeStrength = 12f;\n    private Rigidbody body;\n    private float throttle;\n    private float steering;\n    private bool braking;\n    private void Awake() { body = GetComponent<Rigidbody>(); body.centerOfMass = new Vector3(0f, -0.55f, 0f); }\n    public void SetThrottle(float value) => throttle = Mathf.Clamp(value, -1f, 1f);\n    public void SetSteering(float value) => steering = Mathf.Clamp(value, -1f, 1f);\n    public void SetBrake(bool value) => braking = value;\n    private void FixedUpdate()\n    {\n        if (body == null) return;\n        if (body.velocity.magnitude < maxSpeed && throttle > 0f) body.AddForce(transform.forward * throttle * acceleration, ForceMode.Acceleration);\n        if (throttle < 0f) body.AddForce(transform.forward * throttle * acceleration * 0.5f, ForceMode.Acceleration);\n        if (braking && body.velocity.sqrMagnitude > 0.01f) body.AddForce(-body.velocity.normalized * brakeStrength, ForceMode.Acceleration);\n        float turn = steering * steeringDegrees * Mathf.Clamp01(body.velocity.magnitude / 2f) * Time.fixedDeltaTime;\n        if (body.velocity.sqrMagnitude > 0.2f) body.MoveRotation(body.rotation * Quaternion.Euler(0f, turn, 0f));\n    }\n}",
"Assets/Scripts/Trucks/TruckDefinition.cs": "using UnityEngine;\n\n[CreateAssetMenu(menuName = \"Truck Simulator/Truck Definition\")]\npublic class TruckDefinition : ScriptableObject\n{\n    public string displayName = \"International Truck\";\n    public string manufacturer = \"International\";\n    public float engineHorsepower = 450f;\n    public int forwardGears = 10;\n    public float fuelCapacityLitres = 600f;\n    public GameObject truckPrefab;\n}",
"Assets/Scripts/UI/MobileInputBridge.cs": "using UnityEngine;\n\npublic class MobileInputBridge : MonoBehaviour\n{\n    [SerializeField] private TruckController truck;\n    public void ThrottlePressed() { if (truck) truck.SetThrottle(1f); }\n    public void ThrottleReleased() { if (truck) truck.SetThrottle(0f); }\n    public void ReversePressed() { if (truck) truck.SetThrottle(-1f); }\n    public void ReverseReleased() { if (truck) truck.SetThrottle(0f); }\n    public void BrakePressed() { if (truck) truck.SetBrake(true); }\n    public void BrakeReleased() { if (truck) truck.SetBrake(false); }\n    public void SteeringChanged(float value) { if (truck) truck.SetSteering(value); }\n}",
"Assets/README.txt": "# International Truck Simulator — starter files\n\nThis is a set of starter files for use inside a real Unity project. It is not a complete Unity project and cannot compile on Android by itself.\n\n## Suggested structure\nAssets/Scripts/Trucks/TruckController.cs\nAssets/Scripts/Trucks/TruckDefinition.cs\nAssets/Scripts/UI/MobileInputBridge.cs\n\nCopy these files into a real Unity project, add Rigidbody and colliders to a truck GameObject, attach TruckController, connect UI events to MobileInputBridge, then test and tune in Unity. This controller is a prototype, not production vehicle physics.\n\nThe included workflow template uses GameCI. Confirm current action compatibility, Unity version support and licence-secret requirements before using it.\n",
"Packages/README.txt": "Keep Packages/manifest.json and packages-lock.json from your real Unity project. These notes are not a replacement.",
"ProjectSettings/README.txt": "Copy ProjectSettings from your actual Unity project. These notes are not a replacement."
};

Object.assign(files, starter);
const UMS_STORAGE_KEY = "ums-workspace-files-v1";

function saveWorkspaceToDevice() {
    try {
        localStorage.setItem(UMS_STORAGE_KEY, JSON.stringify({
            files: files,
            currentPath: currentPath
        }));
        return true;
    } catch (error) {
        console.warn("Workspace save failed:", error);
        return false;
    }
}

function restoreWorkspaceFromDevice() {   
    try {
        const saved = localStorage.getItem(UMS_STORAGE_KEY);
        if (!saved) return;

        const workspace = JSON.parse(saved);

        if (
            workspace &&
            workspace.files &&
            typeof workspace.files === "object" &&
            !Array.isArray(workspace.files)
        ) {
            Object.assign(files, workspace.files);
        }

        if (
            typeof workspace.currentPath === "string" &&
            Object.prototype.hasOwnProperty.call(files, workspace.currentPath)
        ) {
            currentPath = workspace.currentPath;
        }
    } catch (error) {
        console.warn("Workspace restore failed:", error);
    }
}

restoreWorkspaceFromDevice();

function msg(s) {
    $("message").textContent = s;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function updateStats() {
    $("fileCount").textContent = Object.keys(files).length;
    $("projectNameStat").textContent = projectName();
}

function projectName() {
    return localStorage.getItem("ums-project-name") || "International Truck Simulator";
}

function renderTree() {
    const tree = $("tree");
    tree.innerHTML = "";
    const paths = Object.keys(files).sort();
    const folders = new Set();

    paths.forEach(p => {
        const parts = p.split("/");
        for (let i = 1; i < parts.length; i++) {
            folders.add(parts.slice(0, i).join("/"));
        }
    });

    [...folders].sort().forEach(f => {
        const b = document.createElement("button");
        b.className = "treeitem folder";
        b.textContent = "▸ " + f;
        b.onclick = () => {
            const first = paths.find(p => p.startsWith(f + "/"));
            if (first) selectFile(first);
        };
        tree.appendChild(b);
    });

    paths.forEach(p => {
        const b = document.createElement("button");
        b.className = "treeitem" + (p === currentPath ? " active" : "");
        b.textContent = "　" + p.split("/").pop();
        b.title = p;
        b.onclick = () => selectFile(p);
        tree.appendChild(b);
    });

    updateStats();
}

function selectFile(path) {
    if (!(path in files)) return;
    currentPath = path;
    $("currentPath").textContent = path;
    $("filename").value = path;
    $("code").value = files[path];
    renderTree();
    saveWorkspaceToDevice();
}

function saveFile() {
    const path = $("filename").value.trim();

    if (!path) {
        msg("Enter a file path.");
        return;
    }

    if (path.startsWith("/") || path.split("/").includes("..")) {
        msg("Use a relative project path without '..'.");
        return;
    }

    files[path] = $("code").value;
    if (!saveWorkspaceToDevice()) {
    msg("File saved in the editor, but device storage is full or unavailable. Export a backup.");
    return;
    }
    
    currentPath = path;
    renderTree();
    $("currentPath").textContent = path;

    const saved = saveWorkspaceToDevice();
    msg(saved
        ? "Saved " + path + " on this device."
        : "File updated, but browser storage is full or unavailable. Export a backup.");
}

function download(name, data, type = "text/plain") {
    const a = document.createElement("a");
    const url = URL.createObjectURL(new Blob([data], { type }));
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function backupJson() {
    return JSON.stringify({
        format: "UnityMobileStudioProject",
        version: 2,
        projectName: projectName(),
        files
    }, null, 2);
}

function exportJson() {
    download("unity-mobile-studio-backup.json", backupJson(), "application/json");
    msg("JSON backup exported.");
}

async function exportZip() {
    if (typeof JSZip === "undefined") {
        msg("ZIP library did not load. Check internet and reload.");
        return;
    }

    try {
        const zip = new JSZip();

        Object.entries(files).forEach(([path, content]) => {
            zip.file(path, content);
        });

        zip.file(
            "MOBILE_STUDIO_README.txt",
            "Exported workspace text files. Copy into a real Unity project; this is not a complete project by itself."
        );

        const blob = await zip.generateAsync({
            type: "blob"
        });

        const filename =
            projectName().toLowerCase().replace(/[^a-z0-9]+/g, "-") +
            "-files.zip";

        const message = $("message");
        message.textContent = "";

        const note = document.createElement("p");
        note.textContent =
            "ZIP ready. Tap the link below to download it:";
        message.appendChild(note);

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.textContent = "Download " + filename;
        link.style.display = "block";
        link.style.padding = "16px";
        link.style.wordBreak = "break-word";
        message.appendChild(link);

    } catch (error) {
        msg("ZIP export failed: " + error.message);
    }
}


async function importZip(file) {
    if (typeof JSZip === "undefined") {
        msg("ZIP library did not load. Check internet and reload.");
        return;
    }

    try {
        const zip = await JSZip.loadAsync(file);
        let count = 0;

        for (const [path, item] of Object.entries(zip.files)) {
            if (item.dir) continue;
            if (path.startsWith("/") || path.split("/").includes("..")) continue;

            const lower = path.toLowerCase();
            if (
                lower.endsWith(".cs") ||
                lower.endsWith(".json") ||
                lower.endsWith(".txt") ||
                lower.endsWith(".yml") ||
                lower.endsWith(".yaml") ||
                lower.endsWith(".asmdef") ||
                lower.endsWith(".md")
            ) {
                files[path] = await item.async("string");
                count++;
            }
        }

        const first = Object.keys(files).find(p => p.endsWith(".cs")) || Object.keys(files)[0];
        if (first) selectFile(first);

        renderTree();
        saveWorkspaceToDevice();
        msg("Imported " + count + " text/config files. Binary assets are intentionally skipped by this lightweight editor.");
    } catch (e) {
        msg("Could not read that ZIP. Choose a valid project ZIP.");
    }
}

function switchTab(name) {
    document.querySelectorAll(".tab").forEach(b =>
        b.classList.toggle("active", b.dataset.tab === name)
    );

    ["files", "build", "guide"].forEach(n =>
        $(n + "Tab").classList.toggle("hidden", n !== name)
    );
}

document.querySelectorAll(".tab").forEach(b =>
    b.onclick = () => switchTab(b.dataset.tab)
);

$("saveFile").onclick = saveFile;

$("newFile").onclick = () => {
    const path = prompt(
        "Enter the new file path:",
        "Assets/Scripts/Trucks/MyNewTruck.cs"
    );

    if (path === null) return;

    const newPath = path.trim();

    if (!isSafeProjectPath(newPath)) {
        msg("Enter a safe relative file path.");
        return;
    }

    if (Object.prototype.hasOwnProperty.call(files, newPath)) {
        msg("That file already exists. Choose a different path.");
        return;
    }

    const extension = newPath.split(".").pop().toLowerCase();

    let content = "";

    if (extension === "cs") {
        content =
            "using UnityEngine;\n\n" +
            "public class MyNewTruck : MonoBehaviour\n" +
            "{\n" +
            "    private void Start()\n" +
            "    {\n" +
            "    }\n\n" +
            "    private void Update()\n" +
            "    {\n" +
            "    }\n" +
            "}\n";
    }

    files[newPath] = content;
    currentPath = newPath;

    renderTree();
    selectFile(newPath);

try {
    const savedWorkspace = localStorage.getItem(UMS_STORAGE_KEY);
    const savedData = savedWorkspace
        ? JSON.parse(savedWorkspace)
        : null;

    const existsInStorage = Boolean(
        savedData &&
        savedData.files &&
        Object.prototype.hasOwnProperty.call(
            savedData.files,
            newPath
        )
    );

    msg(
        existsInStorage
            ? "Diagnostic: new file is present in saved storage."
            : "Diagnostic: new file is missing from saved storage."
    );
} catch (error) {
    msg("Diagnostic failed: " + error.message);
}

    if (saveWorkspaceToDevice()) {
        msg("Created " + newPath + ".");
    } else {
        msg("File created for this session, but device storage failed.");
    }
};


function isSafeProjectPath(path) {
    return Boolean(
        path &&
        !path.startsWith("/") &&
        !path.split("/").includes("..") &&
        !path.endsWith("/")
    );
}

$("renameFile").onclick = () => {
    const oldPath = currentPath;
    const newPath = $("filename").value.trim();

    if (!oldPath || !Object.prototype.hasOwnProperty.call(files, oldPath)) {
        msg("Select an existing file first.");
        return;
    }

    if (!isSafeProjectPath(newPath)) {
        msg("Enter a safe relative file path.");
        return;
    }

    if (newPath === oldPath) {
        msg("The file path has not changed.");
        return;
    }

    if (Object.prototype.hasOwnProperty.call(files, newPath)) {
        msg("A file already exists at that path. Choose another name.");
        return;
    }

    files[oldPath] = $("code").value;
    files[newPath] = files[oldPath];
    delete files[oldPath];

    currentPath = newPath;
    $("filename").value = newPath;
    $("currentPath").textContent = newPath;

    renderTree();

    if (saveWorkspaceToDevice()) {
        msg("Renamed file to " + newPath + ".");
    } else {
        msg("Rename made in this session, but device storage failed. Export a backup.");
    }
};

$("deleteFile").onclick = () => {
    const path = currentPath;

    if (!path || !Object.prototype.hasOwnProperty.call(files, path)) {
        msg("Select an existing file first.");
        return;
    }

    if (!confirm("Delete " + path + "? This cannot be undone here. Export a backup first if needed.")) {
        return;
    }

    const remaining = Object.keys(files).filter(p => p !== path);

    if (remaining.length === 0) {
        msg("Keep at least one file in the workspace.");
        return;
    }

    delete files[path];

    currentPath = remaining[0];
    selectFile(currentPath);
    renderTree();

    if (saveWorkspaceToDevice()) {
        msg("Deleted " + path + ".");
    } else {
        msg("File deleted in this session, but device storage failed. Export a backup.");
    }
};


$("downloadFile").onclick = () =>
    download(
        ($("filename").value.split("/").pop() || "script.txt"),
        $("code").value
    );

/* Autosave editor changes as you type. */
$("code").addEventListener("input", () => {
    const path = $("filename").value.trim();

    if (
        path &&
        !path.startsWith("/") &&
        !path.split("/").includes("..")
    ) {
        files[path] = $("code").value;
        currentPath = path;
        saveWorkspaceToDevice();
    }
});

$("exportJson").onclick = exportJson;
$("exportZip").onclick = exportZip;

$("addFile").onclick = () => {
    const path = prompt("New relative project file path", "Assets/Scripts/NewScript.cs");
    if (!path) return;

    if (path.startsWith("/") || path.split("/").includes("..")) {
        msg("Use a safe relative path.");
        return;
    }

    files[path] = path.endsWith(".cs")
        ? "using UnityEngine;\n\npublic class NewScript : MonoBehaviour\n{\n    private void Start()\n    {\n    }\n}"
        : "";

    selectFile(path);
    saveWorkspaceToDevice();
    msg("Created " + path + ". Edit it and press Save file.");
};

$("refreshTree").onclick = renderTree;

$("newProject").onclick = () => {
    const n = prompt("Name your workspace", "My Unity Game");

    if (n && n.trim()) {
        localStorage.setItem("ums-project-name", n.trim());
        updateStats();
        saveWorkspaceToDevice();
        msg("Workspace renamed to " + n.trim() + ". Existing files were preserved.");
    }
};

$("importZip").onclick = () => $("zipInput").click();

$("zipInput").onchange = e => {
    if (e.target.files[0]) importZip(e.target.files[0]);
    e.target.value = "";
};

$("makeWorkflow").onclick = () => {
    const app = $("appName").value.trim() || "Unity Android Game";
    const version = $("unityVersion").value.trim() || "6000.0.23f1";
    const bundle = $("bundleId").value.trim() || "com.example.unitygame";

    if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(bundle)) {
        msg("Package ID should look like com.studio.game.");
        switchTab("build");
        return;
    }

    const safe = app.replace(/[^A-Za-z0-9_-]+/g, "-");

    const yml = `name: Build Android APK
on:
  workflow_dispatch:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Build Android APK
        uses: game-ci/unity-builder@v4
        env:
          UNITY_LICENSE: \${{ secrets.UNITY_LICENSE }}
          UNITY_EMAIL: \${{ secrets.UNITY_EMAIL }}
          UNITY_PASSWORD: \${{ secrets.UNITY_PASSWORD }}
        with:
          targetPlatform: Android
          unityVersion: ${version}
          buildName: ${safe}
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Android-build
          path: build/Android
`;

    download("build-android.yml", yml);
    msg("Workflow template downloaded. Review GameCI documentation and Unity licensing requirements before use.");
};

$("downloadBuildGuide").onclick = () =>
    download("ANDROID_BUILD_CHECKLIST.txt", `ANDROID UNITY BUILD CHECKLIST

1. Commit a complete Unity project including Assets, Packages and ProjectSettings.
2. Place build-android.yml at .github/workflows/build-android.yml.
3. Check the current GameCI Unity Builder documentation and supported Unity versions.
4. Configure the correct Unity licence secrets in GitHub repository settings.
5. Run Actions manually and review logs.
6. Download the APK artifact only after a successful build.

Package ID entered in this workspace: ${$("bundleId").value}

This app only generates a workflow template; it does not compile the Unity project.
`);

$("openGithub").onclick = () =>
    window.open("https://github.com/", "_blank", "noopener");

let deferred = null;

window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e;
    $("installBtn").classList.remove("hidden");
});

$("installBtn").onclick = async () => {
    if (deferred) {
        deferred.prompt();
        await deferred.userChoice;
        deferred = null;
    } else {
        msg("For installation, host this app over HTTPS and use Chrome menu → Install app / Add to Home screen.");
    }
};

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
}

renderTree();
selectFile(currentPath);
saveWorkspaceToDevice();

msg("Workspace ready. Files are stored in this browser until exported.");
    
