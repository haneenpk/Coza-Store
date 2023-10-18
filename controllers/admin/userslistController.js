const User = require("../../models/usersModel")


const loadUsers = async (req, res) => {
    const { query } = req.query;
    const perPage = 10; // Number of users per page
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

    try {
        let users;
        let totalUsers;

        if (query) {
            users = await User.find({ username: { $regex: '.*' + query + '.*', $options: 'i' }, is_admin: 0 })
                .skip((page - 1) * perPage) // Skip users on previous pages
                .limit(perPage); // Limit the number of users per page

            totalUsers = await User.countDocuments({ username: { $regex: '.*' + query + '.*', $options: 'i' }, is_admin: 0 });
        } else {
            users = await User.find({ is_admin: 0 })
                .skip((page - 1) * perPage) // Skip users on previous pages
                .limit(perPage); // Limit the number of users per page

            totalUsers = await User.countDocuments({ is_admin: 0 });
        }

        const totalPages = Math.ceil(totalUsers / perPage);

        res.render("admin/users", {
            users,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.log(error.message);
    }
};

const blockUser = async (req, res) => {

    try {

        const id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { blocked: true } });

        // Check if the blocked user is currently logged in
        if (req.session.id === id) {
            // Destroy the user's session
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error destroying session:", err);
                }
            });
        }

        res.redirect("/admin/users");

    } catch (error) {
        console.log(error.message);
    }

}

const unblockUser = async (req, res) => {

    try {

        const id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { blocked: false } });
        res.redirect("/admin/users");

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    blockUser,
    unblockUser,
    loadUsers,
}