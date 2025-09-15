// src/components/DiscordIntegrationSection.jsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Section from './Section'; // Importamos o nosso novo componente

const DiscordIntegrationSection = ({ character, onUpdate, isMaster, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleChange = (e) => {
        onUpdate('discordWebhookUrl', e.target.value);
    };

    return (
        <Section title="Integração com Discord" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div>
                <label htmlFor="discordWebhookUrl" className="block text-sm font-medium text-textSecondary mb-1">URL do Webhook do Canal:</label>
                <input
                    type="text"
                    id="discordWebhookUrl"
                    name="discordWebhookUrl"
                    value={character.discordWebhookUrl || ''}
                    onChange={handleChange}
                    className="w-full p-2 bg-bgInput border border-bgElement rounded-md focus:ring-btnHighlightBg focus:border-btnHighlightBg text-textPrimary"
                    placeholder="Cole a URL do Webhook do seu canal do Discord aqui"
                    disabled={!canEdit}
                />
                <p className="text-xs text-textSecondary mt-2">
                    Com a URL do Webhook configurada, os comandos de rolagem serão enviados diretamente para o seu canal do Discord.
                </p>
            </div>
        </Section>
    );
};

export default DiscordIntegrationSection;