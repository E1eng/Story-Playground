import { createPublicClient, http, formatEther } from "viem";
import { aeneid } from "@story-protocol/core-sdk";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http("https://mainnet.storyrpc.io"),
});

const LICENSE_REGISTRY = "0x529a750E02d8E2f15649c13D69a465286a780e24";
const PIL_TEMPLATE = "0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316";

async function getAllLicenses(ipId: string) {
  // 1. Dapatkan jumlah license yang terpasang
  const count = await publicClient.readContract({
    address: LICENSE_REGISTRY,
    abi: [{
      name: "getAttachedLicenseTermsCount",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "ipId", type: "address" }],
      outputs: [{ type: "uint256" }],
    }],
    functionName: "getAttachedLicenseTermsCount",
    args: [ipId],
  });

  console.log(`Total licenses: ${count}`);

  // 2. Loop untuk setiap license
  for (let i = 0n; i < count; i++) {
    // Dapatkan licenseTemplate & licenseTermsId
    const [licenseTemplate, licenseTermsId] = await publicClient.readContract({
      address: LICENSE_REGISTRY,
      abi: [{
        name: "getAttachedLicenseTerms",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "ipId", type: "address" },
          { name: "index", type: "uint256" }
        ],
        outputs: [
          { name: "licenseTemplate", type: "address" },
          { name: "licenseTermsId", type: "uint256" }
        ],
      }],
      functionName: "getAttachedLicenseTerms",
      args: [ipId, i],
    });

    // 3. Dapatkan detail license terms
    const detail = await publicClient.readContract({
      address: PIL_TEMPLATE,
      abi: [{
        name: "getLicenseTerms",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "selectedLicenseTermsId", type: "uint256" }],
        outputs: [{
          type: "tuple",
          components: [
            { name: "transferable", type: "bool" },
            { name: "royaltyPolicy", type: "address" },
            { name: "defaultMintingFee", type: "uint256" },
            { name: "expiration", type: "uint256" },
            { name: "commercialUse", type: "bool" },
            { name: "commercialAttribution", type: "bool" },
            { name: "commercializerChecker", type: "address" },
            { name: "commercializerCheckerData", type: "bytes" },
            { name: "commercialRevShare", type: "uint32" },
            { name: "commercialRevCeiling", type: "uint256" },
            { name: "derivativesAllowed", type: "bool" },
            { name: "derivativesAttribution", type: "bool" },
            { name: "derivativesApproval", type: "bool" },
            { name: "derivativesReciprocal", type: "bool" },
            { name: "derivativeRevCeiling", type: "uint256" },
            { name: "currency", type: "address" },
            { name: "uri", type: "string" }
          ]
        }]
      }],
      functionName: "getLicenseTerms",
      args: [licenseTermsId],
    });

    console.log(`\n--- License #${i + 1n} ---`);
    console.log(`License Terms ID: ${licenseTermsId}`);
    console.log(`Commercial Use: ${detail.commercialUse}`);
    console.log(`Derivatives Allowed: ${detail.derivativesAllowed}`);
    console.log(`Minting Fee: ${formatEther(detail.defaultMintingFee)} IP`}`);
    console.log(`Rev Share: ${detail.commercialRevShare / 1_000_000}%`);
  }
}

// Panggil fungsi
getAllLicenses("0x..."); // masukkan IP Address

/*
Output

Total licenses: 2

--- License #1 ---
License Terms ID: 1
Commercial Use: false
Derivatives Allowed: true
Minting Fee: 0
Rev Share: 0%

--- License #2 ---
License Terms ID: 5
Commercial Use: true
Derivatives Allowed: true
Minting Fee: 1000000000000000000
Rev Share: 10%```
*/
