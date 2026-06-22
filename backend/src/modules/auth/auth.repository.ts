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

// find by id
export const findById = ( accountId: string ) => {
    return Account.findById({ accountId }).select(" +refreshToken ");
}


