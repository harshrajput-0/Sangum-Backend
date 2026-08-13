import User, { IUser } from "./user.model.js";

// findbyid
export const findById = (userId: string) => {
    return User.findById(userId);
};

// findbyusername
export const findByUsername = (username: string) => {
    return User.findOne({username});
};

// findbyaccountId
export const findByAccountId = (accountId: string) => {
    return User.findOne({ accountId });
};

// createUser
export const createUser = (data: Partial<IUser>) => {
    return User.create(data);
};

// update user
export const updateUser = (userId: string, data: Partial<IUser>) => {
    return User.findByIdAndUpdate(userId, data, {new: true});
};


// Update Online Status
export const updateOnlineStatus = (userId: string, isOnline: boolean) => {
    return User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date(),
    });
};

/* 
* Text Search across username + displayName. Require the text index
* Implement after search implemented
*  
*/


// searchUsers
// export const searchUsers = (query: string, { skip, limit }: PaginationParams) => {
//     return User.find({ $text : {$search: query } }).skip(skip).limit(limit);
// };

// countSearchResults

// findManyByIds

// check if username exist
export const usernameExist = (username: string) => {
    return User.exists({username});
}