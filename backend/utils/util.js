// General Utils file for permissions
export const isGroupAdmin = (user, group) => {
    if (!user) return false;

    if (!group) return false;

    if (user.isSuperAdmin) return true;

    return group.admins.some(adminId => adminId.equals(user._id));
}

export const isSuperAdmin = (user) => {
    if (!user) return false;

    return user.isSuperAdmin;
}

export const isOwner = (user, player) => {
    if (!user) return false;

    if (!player) return false;

    return user._id.equals(player.userId);
}