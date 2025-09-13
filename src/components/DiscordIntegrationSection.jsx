import React from 'react';
import { useAuth } from '../hooks/useAuth';

const DiscordIntegrationSection = ({ character, onUpdate, isMaster, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleChange = (e) => {
        onUpdate('discordWebhookUrl', e.target.value);
    };

    return (
        <section id="discord" className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
                Integração com Discord
                <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <div>
                    <label htmlFor="discordWebhookUrl" className="block text-sm font-medium text-gray-300 mb-1">URL do Webhook do Canal:</label>
                    <input
                        type="text"
                        id="discordWebhookUrl"
                        name="discordWebhookUrl"
                        value={character.discordWebhookUrl || ''}
                        onChange={handleChange}
                        className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white"
                        placeholder="Cole a URL do Webhook do seu canal do Discord aqui"
                        disabled={!canEdit}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        Com a URL do Webhook configurada, os comandos de rolagem serão enviados diretamente para o seu canal do Discord.
                    </p>
                </div>
            )}
        </section>
    );
};

export default DiscordIntegrationSection;
