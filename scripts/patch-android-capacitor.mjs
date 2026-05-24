import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const appBuildGradle = join(root, 'android/app/build.gradle');
const proguardRules = join(root, 'android/app/proguard-rules.pro');

function readRequiredFile(path) {
  if (!existsSync(path)) {
    throw new Error(`${path} not found. Run "npx cap add android" or "npx cap sync android" first.`);
  }

  return readFileSync(path, 'utf8');
}

function writeIfChanged(path, before, after) {
  if (before === after) {
    return false;
  }

  writeFileSync(path, after);
  return true;
}

function patchBuildGradle() {
  const source = readRequiredFile(appBuildGradle);
  let next = source;

  const signingGuard = `def releaseStoreFilePath = project.findProperty('RELEASE_STORE_FILE')?.toString()
def releaseStorePasswordValue = project.findProperty('RELEASE_STORE_PASSWORD')?.toString()
def releaseKeyAliasValue = project.findProperty('RELEASE_KEY_ALIAS')?.toString()
def releaseKeyPasswordValue = project.findProperty('RELEASE_KEY_PASSWORD')?.toString()
def releaseSigningConfigured = releaseStoreFilePath
        && releaseStorePasswordValue
        && releaseKeyAliasValue
        && releaseKeyPasswordValue
        && releaseStorePasswordValue != 'CHANGE_ME'
        && releaseKeyPasswordValue != 'CHANGE_ME'
        && file(releaseStoreFilePath).exists()
`;

  if (!next.includes('def releaseSigningConfigured = releaseStoreFilePath')) {
    next = next.replace(
      "apply plugin: 'com.android.application'\n",
      `apply plugin: 'com.android.application'\n\n${signingGuard}\n`,
    );
  }

  next = next.replace(
    /signingConfigs\s*\{\s*release\s*\{\s*if\s*\(project\.hasProperty\('RELEASE_STORE_FILE'\)\)\s*\{\s*storeFile file\(RELEASE_STORE_FILE\)\s*storePassword RELEASE_STORE_PASSWORD\s*keyAlias RELEASE_KEY_ALIAS\s*keyPassword RELEASE_KEY_PASSWORD\s*\}\s*\}\s*\}/s,
    `signingConfigs {
        release {
            // Values come from local/CI Gradle properties. Placeholder values are ignored.
            if (releaseSigningConfigured) {
                storeFile file(releaseStoreFilePath)
                storePassword releaseStorePasswordValue
                keyAlias releaseKeyAliasValue
                keyPassword releaseKeyPasswordValue
            }
        }
    }`,
  );

  next = next.replace(
    /release\s*\{\s*signingConfig signingConfigs\.release\s*minifyEnabled true/s,
    `release {
            if (releaseSigningConfigured) {
                signingConfig signingConfigs.release
            } else {
                logger.lifecycle("Release signing is not configured; assembling an unsigned release artifact.")
            }
            minifyEnabled true`,
  );

  return writeIfChanged(appBuildGradle, source, next);
}

function patchProguardRules() {
  const source = readRequiredFile(proguardRules);

  if (source.includes('-dontwarn com.facebook.login.LoginManager')) {
    return false;
  }

  const facebookRules = `
# Facebook auth classes are referenced by the Capacitor Firebase Auth plugin,
# but BayFatura only enables Google and Apple providers.
-dontwarn com.facebook.CallbackManager$Factory
-dontwarn com.facebook.CallbackManager
-dontwarn com.facebook.FacebookCallback
-dontwarn com.facebook.login.LoginManager
-dontwarn com.facebook.login.widget.LoginButton
`;

  const anchor = '-keep class com.getcapacitor.community.firebaseauthentication.** { *; }\n';
  const next = source.includes(anchor)
    ? source.replace(anchor, `${anchor}${facebookRules}`)
    : `${source.trimEnd()}\n${facebookRules}\n`;

  return writeIfChanged(proguardRules, source, next);
}

const changed = [
  ['android/app/build.gradle', patchBuildGradle()],
  ['android/app/proguard-rules.pro', patchProguardRules()],
].filter(([, didChange]) => didChange);

if (changed.length === 0) {
  console.log('Android Capacitor patches already applied.');
} else {
  console.log(`Applied Android Capacitor patches: ${changed.map(([file]) => file).join(', ')}`);
}
