import Account, { IAccount, IOAuthProvider, AuthProvider} from "./account.model";


// find by email
export const findByEmail = (email: string) => {
    return Account.findOne({ email })
    .select("+password +refreshToken");     // required to compare as password as select: false now, 
}

// find by userId
export const findByUserId = ( userId: string ) => {
    return Account.findOne({ userId });
}

// find by accountId
export const findById = ( accountId: string ) => {
    return Account.findById({ accountId }).select(" +refreshToken ");
}

// Create Account
export const createAccount = (data: Partial<IAccount>) => {
    return Account.create(data);
}

// Update Refresh Token using hashedToken
 export const updateRefreshToken = (accountId: string, hashedToken: string) => {
    return Account.findByIdAndUpdate( accountId, { refreshToken: hashedToken } );
 };


// Clearing refreshToken 
export const clearRefreshToken = (accountId: string) => {
    return Account.findByIdAndUpdate( accountId, { $unset: {refreshToken: 1}})
}

// Set Emaill in Account using accountId  
export const setEmail = (accountId: string, email: string) => {
    return Account.findByIdAndUpdate( accountId, { email }, { new: true });
};

// Check Email in Account  
export const checkEmailExists = (email: string) => {
    return Account.exists({ email });
};
