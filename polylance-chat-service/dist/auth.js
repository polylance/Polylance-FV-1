import { ethers } from "ethers";
export async function verifyWalletAuth(address, signature, message) {
    if (!address || !signature || !message)
        return false;
    try {
        const recovered = ethers.verifyMessage(message, signature);
        return recovered.toLowerCase() === address.toLowerCase();
    }
    catch (err) {
        return false;
    }
}
