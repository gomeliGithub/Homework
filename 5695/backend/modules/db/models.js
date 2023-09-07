import { DataTypes, Model } from 'sequelize';

export default async function defineModels (sequelize) {
    class Client extends Model {}

    Client.init({
        login: {
            type: DataTypes.STRING,
            allowNull: false
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        }
    },  {
        sequelize,
        modelName: 'Client',
        timestamps: false
    });

    return { Client };
}