/**
 * This script tests the Environmental variables "LADOK_API_BASEURL"
 * and "LADOK_API_PFX_BASE64"
 */
import "./config/start";
import log from "skog";
import {
  getAutentiserad,
  getOwnAnvandarBehorighet,
} from "./externalApis/ladokApi";

// ID for the Ladok "behörighetsprofil" KTH - System Resultatrapportering Canvas
const PROFILE_ID = "629ea509-6043-11e9-9dcc-b1e66e1540b0";

async function start() {
  const a = await getAutentiserad();
  log.info(`Username is: ${a.Anvandarnamn}`);
  const b = await getOwnAnvandarBehorighet();
  if (b.Anvandarbehorighet.length !== 1) {
    log.info(
      `This user has ${b.Anvandarbehorighet.length} profiles and should have only one`
    );
    return;
  }

  if (
    b.Anvandarbehorighet.find((p) => p.BehorighetsprofilRef.Uid === PROFILE_ID)
  ) {
    log.info(`This user has the correct profile.`);
  } else {
    log.error("This user does not have the correct profile");
    return;
  }
}

start();
