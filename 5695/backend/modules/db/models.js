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
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },

        confirm_sid: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },  {
        sequelize,
        modelName: 'Client',
        timestamps: false
    });

    return { Client };
}