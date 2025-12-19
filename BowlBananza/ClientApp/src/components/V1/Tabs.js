import React, { useState, useCallback } from 'react';

const Tab = ({ isSelected = false, text = '', onSelect = (text) => { }}) => {
    return (
        <div className={`tab ${isSelected ? 'selectedTab' : ''}`} onClick={() => onSelect(text)}>
            <span>{text}</span>
        </div>
    );
};

export const Tabs = ({ tabs = [], panels = {}, selected = '', onSelect = (text) => { } }) => {
    const [selectedTab, setSelectedTab] = useState(selected);

    const _onClick = useCallback((text) => {
        setSelectedTab(text);
        onSelect(text);
    }, [setSelectedTab, onSelect]);

    const _selected = selectedTab || tabs[0];
    return (
        <div>
            <div className="tabs">{tabs.map(tab => <Tab isSelected={_selected === tab} text={tab} onSelect={_onClick} />)}</div>
            <div className="tabContent">
                {panels[_selected] ?? <div>An error occurred</div>}
            </div>
        </div>
    )
};