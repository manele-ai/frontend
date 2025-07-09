import { GoogleAuth } from "google-auth-library";

let auth: GoogleAuth;

// [START v2GetFunctionUri]
/**
 * Get the URL of a given v2 cloud function.
 *
 * @param {string} name the function's name
 * @param {string} location the function's location
 * @return {Promise<string>} The URL of the function
 */
export async function getFunctionUrl(name: string, location="us-central1") {
  if (!auth) {
    auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
  }
  const projectId = await auth.getProjectId();
  const url = `https://${location}-${projectId}.cloudfunctions.net/${name}`;

  const client = await auth.getClient();
  const res = await client.request({url});
  const data = res.data as any;
  const uri = data?.serviceConfig?.uri;
  if (!uri) {
    throw new Error(`Unable to retreive uri for function at ${url}`);
  }
  return uri;
}
