export const DEFAULT_RELEASE_MESSAGE_TEMPLATE = `<STAGING> DEPLOYMENT - <{{releasePackage}}>

<Deployers Names> <Requesting your kind assignment for <STAGING> deployment of the <{{releasePackage}}>.>

<The release is large in comparison to other, please follow preparation, caution, study, recommendation as per documentation of release doc & deployment plan. Please let me know of any required assistance or query.>

Package Name : <{{releasePackage}}>
Package Link : <{{downloadLink}}>
Password : <{{downloadPassword}}>`;

export function applyReleaseTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }, template);
}