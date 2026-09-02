"use client";

import { DifferencePortraitView } from "@/components/difference";
import { DesignerForm } from "./designer-form";
import { DesignerPreview } from "./designer-preview";
import { MakingRequest } from "./making-request";
import { useDesigner } from "./hooks";

export function CustomDesigner() {
  const designer = useDesigner();
  return (
    <>
      <div className="grid min-w-0 items-start gap-[clamp(2.5rem,6vw,7rem)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <DesignerForm
          category={designer.category}
          prompt={designer.prompt}
          setPrompt={designer.setPrompt}
          memory={designer.memory}
          setMemory={designer.setMemory}
          permission={designer.permission}
          setPermission={designer.setPermission}
          status={designer.status}
          error={designer.error}
          brief={designer.brief}
          setBrief={designer.setBrief}
          direction={designer.direction}
          setDirection={designer.setDirection}
          chooseCategory={designer.chooseCategory}
          submit={designer.submit}
          abort={designer.abort}
          presets={designer.presets}
          directions={designer.directions}
        />
        <DesignerPreview
          image={designer.image}
          status={designer.status}
          selectedCategory={designer.selectedCategory}
          onReset={designer.resetPreview}
        />
      </div>
      {designer.status === "done" && designer.selectedCategory ? (
        <MakingRequest
          intendedUse={designer.intendedUse}
          setIntendedUse={designer.setIntendedUse}
          onSubmit={designer.requestMaking}
        />
      ) : null}
      {designer.livePortrait ? (
        <DifferencePortraitView
          portrait={designer.livePortrait}
          image={designer.image}
          privateReveal
        />
      ) : null}
    </>
  );
}
